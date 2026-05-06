# Contrato de integração — Avatar do Usuário

Documento compartilhado entre o agente do **backend** (`api`) e o agente do **frontend** (`role-sc-frontend`). Define a arquitetura, a infra AWS necessária e o contrato de API pra upload de avatar de usuário no Rolê SC.

> **Para o agente de backend:** esse é o documento autoritativo. O frontend já está implementado e funcional, esperando os endpoints. Qualquer divergência deve ser discutida antes de implementar.

> Documentos irmãos: `CONTRATO_VERIFICACAO_EMAIL.md`, `CONTRATO_RECUPERACAO_SENHA.md`, `CONTRATO_ALTERAR_SENHA.md`. Releia se tiver dúvida sobre padrões (códigos de erro, princípios, etc).

---

## 1. Contexto

Usuários precisam poder fazer upload de uma **foto de perfil (avatar)** no app. Hoje a tela de Perfil mostra um gradiente azul com a primeira letra do nome — o objetivo é substituir por uma foto real (ou manter o gradiente como fallback se nunca foi feito upload).

**Suporte a GIF é requerido** (decisão de produto).

---

## 2. Decisões arquiteturais

| Decisão | Escolhido | Por quê |
|---------|-----------|---------|
| Onde armazenar | **AWS S3** (bucket dedicado) | Padrão da indústria, escalável, free tier 5GB cobre o TCC e mais |
| Acesso de leitura | **Bucket público** (`public-read` por objeto OU bucket policy) | Avatar não tem requisito de privacidade. URL pública = sem custo de presigned URL pra cada visualização + permite cache no app/CDN. |
| Acesso de escrita | **Presigned URLs** (PUT, validade 5min) | Frontend faz upload direto pro S3, sem passar pela Lambda — economiza CPU, evita limite de payload de 6MB do Lambda. |
| Tipos aceitos | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | Cobrir os formatos comuns + GIF animado (UX mais divertida) |
| Tamanho máximo | **5 MB** | Margem confortável pra fotos grandes ou GIFs animados curtos |
| Estratégia de key | `avatars/{userId}` (sem extensão) | Mesma key sempre = sobrescreve avatar anterior, sem precisar de cleanup de objetos órfãos |
| Cache busting | Query param `?v={timestamp}` na URL pública retornada | Solução simples pra invalidar cache do `<Image>` do React Native quando o user troca avatar |
| Validação no confirm | Backend faz `HEAD` no S3 pra validar que o objeto existe + tamanho + Content-Type | Defesa contra cliente mentir ou objeto não ter sido enviado |
| Lifecycle do bucket | **Sem expiração** (avatares são permanentes) | N/A. Talvez configurar regra futura se houver muitos uploads não-confirmados. |

---

## 3. Setup da infraestrutura AWS

### 3.1 Bucket S3

**Nome sugerido:** `role-sc-avatars` (ou `rolesc-avatars-prod` se preferir prefixo de stage).

**Região:** `sa-east-1` (mesma da Lambda, evita cross-region latency e custos extras).

**Configurações:**

```yaml
# Em pseudocódigo / SAM template
RoleScAvatarsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: role-sc-avatars
    PublicAccessBlockConfiguration:
      BlockPublicAcls: false
      BlockPublicPolicy: false
      IgnorePublicAcls: false
      RestrictPublicBuckets: false
    OwnershipControls:
      Rules:
        - ObjectOwnership: BucketOwnerPreferred
    CorsConfiguration:
      CorsRules:
        - AllowedOrigins: ['*']
          AllowedMethods: [GET, PUT, HEAD]
          AllowedHeaders: ['*']
          ExposedHeaders: [ETag]
          MaxAge: 3000

# Bucket policy: permite leitura pública dos objetos sob avatars/
RoleScAvatarsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref RoleScAvatarsBucket
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: PublicReadAvatars
          Effect: Allow
          Principal: '*'
          Action: s3:GetObject
          Resource: !Sub 'arn:aws:s3:::${RoleScAvatarsBucket}/avatars/*'
```

> ⚠️ **Importante:** o `PublicAccessBlockConfiguration` precisa **desativar todos os 4 blocks** (são `true` por padrão na AWS desde 2023) pra a bucket policy pública funcionar. Sem isso, o bucket policy é ignorado mesmo que esteja correto.

### 3.2 Permissões IAM da Lambda

Adicionar ao role da Lambda (no `template.yaml`):

```yaml
Policies:
  - Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - s3:PutObject       # presigned URL pra upload
          - s3:GetObject       # HEAD/GET no confirm pra validar
          - s3:DeleteObject    # cleanup futuro (opcional nesta fase)
        Resource: !Sub 'arn:aws:s3:::${RoleScAvatarsBucket}/avatars/*'
```

### 3.3 Variáveis de ambiente novas

Adicionar ao `template.yaml` e ao `.env` do `invoke-local`:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `S3_AVATARS_BUCKET` | Nome do bucket | `role-sc-avatars` |
| `S3_AVATARS_REGION` | Região do bucket | `sa-east-1` |

---

## 4. Alterações no modelo de dados

### 4.1 Coleção `users` — adicionar campo `avatarUrl`

```ts
interface User {
  // ... campos existentes
  avatarUrl?: string;   // URL pública S3 com query param ?v=
}
```

`undefined` significa que o usuário nunca fez upload. Frontend mostra fallback (gradiente com inicial).

**Migração:** usuários existentes ficam com `avatarUrl: undefined` (default). Nada a fazer.

---

## 5. Contrato de API

Todos os endpoints abaixo são **autenticados via JWT** (mesmo `auth.hook` já em uso).

### 5.1 `POST /users/me/avatar/upload-url` — novo

Gera uma URL pré-assinada pra o frontend fazer PUT direto no S3.

**Request body:**
```json
{
  "contentType": "image/png",
  "sizeBytes": 245678
}
```

**Validações de schema:**
- `contentType`: enum `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`. Se inválido → **400** com `code: AVATAR_INVALID_TYPE`.
- `sizeBytes`: integer ≥ 0 e ≤ 5242880 (5 MB). Se exceder → **400** com `code: AVATAR_TOO_LARGE`.

**Lógica:**
1. Extrair `userId` do JWT
2. Validar `contentType` e `sizeBytes`
3. Montar `key = "avatars/" + userId` (sem extensão — Content-Type é metadata)
4. Gerar presigned URL com **AWS SDK v3** (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`):
   ```ts
   const command = new PutObjectCommand({
     Bucket: process.env.S3_AVATARS_BUCKET,
     Key: key,
     ContentType: contentType,
     ContentLength: sizeBytes,
   });
   const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
   ```
5. Retornar URL + key + headers que o frontend deve incluir no PUT

**Response 200:**
```json
{
  "success": true,
  "uploadUrl": "https://role-sc-avatars.s3.sa-east-1.amazonaws.com/avatars/664a...?X-Amz-Signature=...",
  "key": "avatars/664a1b2c3d4e5f6a7b8c9d0e",
  "headers": {
    "Content-Type": "image/png"
  }
}
```

> **Sobre os `headers`:** o frontend envia exatamente o que vem aqui no PUT pro S3. Como o `Content-Type` foi incluído no `PutObjectCommand` na assinatura, ele PRECISA bater no PUT, senão o S3 rejeita com 403. Backend deve retornar SEMPRE `{ "Content-Type": <contentType> }` por enquanto. Se um dia adicionar `x-amz-server-side-encryption` ou similar, retornar aqui também.

**Response 400 (tipo inválido):**
```json
{
  "success": false,
  "code": "AVATAR_INVALID_TYPE",
  "message": "Apenas JPG, PNG, WebP e GIF são suportados."
}
```

**Response 400 (tamanho excedido):**
```json
{
  "success": false,
  "code": "AVATAR_TOO_LARGE",
  "message": "Imagem maior que o limite de 5MB."
}
```

---

### 5.2 `POST /users/me/avatar/confirm` — novo

Chamado pelo frontend após o PUT no S3 dar sucesso. Backend valida que o objeto existe, atualiza `user.avatarUrl` com cache busting.

**Request body:**
```json
{
  "key": "avatars/664a1b2c3d4e5f6a7b8c9d0e"
}
```

**Validações:**
- `key`: string, obrigatória, deve **começar com `avatars/{userId}`** do JWT (proteção contra usuário confirmar avatar de outro user). Se não bater → **400** ou **403** com mensagem genérica.

**Lógica:**
1. Extrair `userId` do JWT
2. Validar que `key === "avatars/" + userId`
3. Fazer `HEAD` no S3 pra verificar que o objeto existe:
   ```ts
   const head = await s3Client.send(new HeadObjectCommand({
     Bucket: process.env.S3_AVATARS_BUCKET,
     Key: key,
   }));
   ```
4. Se NotFound → **400** com `code: AVATAR_NOT_UPLOADED`
5. Validar `head.ContentLength <= 5_242_880`. Se exceder → **400** `AVATAR_TOO_LARGE` (defesa em profundidade — usuário poderia ter mentido o sizeBytes lá no início).
6. Validar `head.ContentType` é um dos 4 tipos aceitos. Se não → **400** `AVATAR_INVALID_TYPE`.
7. Montar URL pública: `https://${bucket}.s3.${region}.amazonaws.com/${key}?v=${Date.now()}`
8. Atualizar `users.avatarUrl = urlComCacheBusting`
9. Retornar 200 com a URL

**Response 200:**
```json
{
  "success": true,
  "avatarUrl": "https://role-sc-avatars.s3.sa-east-1.amazonaws.com/avatars/664a...?v=1730859240000"
}
```

**Response 400 (objeto não existe no S3):**
```json
{
  "success": false,
  "code": "AVATAR_NOT_UPLOADED",
  "message": "O upload não foi finalizado. Tente novamente."
}
```

**Response 400 (validação falhou no HEAD):**
Reusa `AVATAR_TOO_LARGE` ou `AVATAR_INVALID_TYPE` conforme o caso.

---

### 5.3 `GET /auth/me` — modificação mínima

Garantir que o `avatarUrl` (quando presente no user) seja incluído no payload de resposta. Mesmo padrão dos outros campos do `UserPublic`.

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "nome": "...",
    "email": "...",
    "emailVerified": true,
    "avatarUrl": "https://...s3.../avatars/...?v=...",
    "createdAt": "..."
  }
}
```

Idem em `POST /auth/login` no campo `user`.

---

## 6. Variáveis de ambiente novas

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `S3_AVATARS_BUCKET` | Nome do bucket | `role-sc-avatars` |
| `S3_AVATARS_REGION` | Região do bucket S3 | `sa-east-1` |

---

## 7. Permissões IAM

Ver seção 3.2.

---

## 8. Checklist de implementação para o agente do backend

- [ ] Criar bucket S3 `role-sc-avatars` em `sa-east-1` com bucket policy pública pra `avatars/*` e CORS configurado (seção 3.1)
- [ ] Adicionar permissões IAM ao role da Lambda no `template.yaml` (seção 3.2)
- [ ] Adicionar variáveis de ambiente `S3_AVATARS_BUCKET` e `S3_AVATARS_REGION` no `template.yaml` e no `.env` de dev
- [ ] Instalar dependências: `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] Atualizar tipo `User` em `src/types/user.types.ts` adicionando `avatarUrl?: string`
- [ ] Atualizar `UserPublic` (response shape) pra incluir `avatarUrl`
- [ ] Criar `src/services/avatar.service.ts` (no backend) com:
  - [ ] `getUploadUrl(userId, contentType, sizeBytes)` → retorna `{ uploadUrl, key, headers }`
  - [ ] `confirmAvatar(userId, key)` → faz HEAD, valida, atualiza user, retorna `{ avatarUrl }`
  - [ ] Helper `buildPublicUrl(key)` que retorna a URL com `?v=Date.now()`
- [ ] Criar `src/routes/users.routes.ts` (se ainda não existir):
  - [ ] `POST /users/me/avatar/upload-url` (autenticado)
  - [ ] `POST /users/me/avatar/confirm` (autenticado)
- [ ] Atualizar `src/schemas/user.schemas.ts` com os JSON Schemas dos 2 endpoints
- [ ] Garantir que `avatarUrl` aparece nos responses de `GET /auth/me` e `POST /auth/login`
- [ ] Atualizar `CONTEXTO_API_BACKEND.md` adicionando os 2 endpoints + bucket
- [ ] Testar manualmente o fluxo completo: app → upload-url → PUT no S3 → confirm → ver avatar no perfil

---

## 9. Status do frontend (já implementado)

Listado para transparência — **não implementar no backend**:

- ✅ `expo-image-picker` adicionado a `package.json` + plugin configurado em `app.json` com mensagens de permissão (camera + photos)
- ✅ `src/types/avatar.types.ts` — tipos do upload + constantes (`AVATAR_MAX_SIZE_BYTES`, `AVATAR_ACCEPTED_MIME_TYPES`)
- ✅ `src/types/auth.types.ts` — campo `avatarUrl?` em `UserPublic` + códigos `AVATAR_TOO_LARGE`, `AVATAR_INVALID_TYPE`, `AVATAR_NOT_UPLOADED`
- ✅ `src/services/avatar.service.ts` — `uploadAvatar(asset)` orquestra os 3 passos (request URL → PUT no S3 → confirm). Lança erros tipados pra UX (`AvatarTooLargeError`, `AvatarInvalidTypeError`).
- ✅ `src/contexts/AuthContext.tsx` — novo método `patchUser(patch)` aplicar mudança parcial sem precisar de getMe inteiro
- ✅ `src/hooks/useAvatarUpload.ts` — encapsula UI: pede permissão, mostra Alert nativo "Tirar foto / Galeria / Cancelar", chama service, mostra `Alert` em caso de erro
- ✅ `src/screens/perfil/PerfilScreen.tsx` — avatar real com fallback pra gradiente; tap no avatar inteiro abre o picker; overlay de loading durante upload

Comportamento esperado do app frente aos códigos do backend:

| Status / `code` | Comportamento do app |
|-----------------|----------------------|
| `200` em `upload-url` + `200` em `confirm` | `patchUser({ avatarUrl })` — atualiza visual em todas as telas instantaneamente |
| `400 AVATAR_INVALID_TYPE` | Não deveria chegar (frontend valida antes) — fallback: `extractErrorMessage` |
| `400 AVATAR_TOO_LARGE` | Idem (frontend valida antes) — fallback: `extractErrorMessage` |
| `400 AVATAR_NOT_UPLOADED` | Alert genérico "Não foi possível enviar a foto" |
| Falha no PUT do S3 | Alert genérico "Falha no upload pra S3 (HTTP X)" |

---

## 10. Princípios que ambos os lados devem respeitar

- **Validação dupla** — frontend valida antes de chamar API (UX rápida, evita chamadas desnecessárias) MAS backend valida também (defesa contra cliente malicioso)
- **Validação dupla no confirm** — frontend confia no backend, mas backend valida o que o S3 efetivamente recebeu (HEAD), não confia em metadata enviado pelo cliente
- **Key sempre derivada do JWT** — usuário não pode confirmar avatar de outro usuário porque o backend rejeita key que não comece com `avatars/{userId}`
- **URLs públicas são OK pra avatar** — não há requisito de privacidade. Se um dia houver (ex: avatares opcionalmente privados), migrar pra presigned URL no GET também.
- **Cache busting via query param** — manter o padrão `?v={timestamp}`. Frontend confia que a URL retornada já vem com cache busting; não tenta gerar isso no client.
- **Cleanup é uma feature opcional** — quando o user troca avatar, sobrescreve a mesma key, então não fica órfão. Se um dia adicionarmos suporte a "remover avatar", aí precisa do `DeleteObject` (já tá nas permissões).

---

## 11. Pontos em aberto (decisão futura)

- **Cleanup quando o user é deletado**: hoje não temos endpoint de deletar conta. Quando tiver, precisará deletar o objeto S3 junto. Já está nas permissões IAM da Lambda.
- **Limite por user / abuse de upload**: ninguém impede um user de chamar `upload-url` mil vezes em sequência (custo: 1000 presigned URLs geradas, sem custo no S3 enquanto o PUT não acontece). Rate limit na Lambda é o ideal — anotar como follow-up.
- **CDN (CloudFront) na frente do bucket**: pra reduzir latência de leitura do avatar globalmente. Atualmente cada `<Image>` no app puxa direto do S3 sa-east-1, que tá no Brasil — latência aceitável. Se o app crescer pra usuários fora do BR, vale adicionar.
- **Variantes (thumbnail vs full)**: hoje servimos sempre o tamanho original. Se algum dia precisar de thumbnails (lista de usuários, etc), gerar via Lambda@Edge ou adicionar sufixo na key (`avatars/{userId}/thumb.png`).
- **Resize server-side**: hoje confiamos no resize do `expo-image-picker` no client (quality 0.8). Se isso virar problema (ex: GIFs de 5MB todos), adicionar etapa de processamento na Lambda no `confirm` (com Sharp ou similar). Trade-off: aumenta tempo de resposta do `confirm`.

---

*Documento v1 — criado pelo agente do frontend após implementação. Qualquer mudança requer comunicação entre os dois lados.*
