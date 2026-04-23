# Contrato de integração — Verificação de Email

Documento compartilhado entre o agente do **backend** (`api`) e o agente do **frontend** (`role-sc-frontend`). Define a arquitetura, o contrato de API e as responsabilidades de cada lado para a funcionalidade de verificação de email no cadastro de usuários do Rolê SC.

> **Para o agente de backend:** esse é o documento autoritativo. O frontend já está sendo atualizado em paralelo pra bater com esse contrato. Qualquer divergência deve ser discutida antes de implementar — não ajuste o contrato unilateralmente.

---

## 1. Contexto

O Rolê SC tem hoje o fluxo de autenticação funcionando (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`, JWT de 7 dias). A responsabilidade agora é **impedir que usuários logem sem verificar o email** e **enviar um link de verificação por email** no cadastro.

Esse documento cobre apenas essa feature. O restante da API (eventos, municípios, categorias) não é afetado.

---

## 2. Decisões arquiteturais (já fechadas)

| Decisão | Escolhido | Por quê |
|---------|-----------|---------|
| Storage do token de verificação | **MongoDB com TTL index** | Já usamos Mongo Atlas. Evita adicionar Redis/DynamoDB. TTL nativo do Mongo auto-deleta documentos expirados, mesmo comportamento do Redis `EX`. |
| Envio de email | **AWS SES (SDK v3)** | Mesmo provedor da Lambda. 62k emails/mês grátis. Credenciais via IAM role, zero secret em código. |
| Confirmação do link | **HTML devolvido pela própria Lambda** (`GET /auth/verify-email`) | Sem repo novo, sem S3+CloudFront. Só adicionar uma rota que retorna `text/html`. |
| Remetente | **Email pessoal do dev verificado no SES** (inicial) | Sem domínio próprio no momento. Funciona no sandbox do SES. Migração pra domínio é só trocar env var. |
| Modo do SES | **Sandbox** (sem pedir production access nesta fase) | Só envia pra emails previamente verificados no console SES. Suficiente pra TCC. |
| Deep link do app | **NÃO usar** | Complexo com Expo Go (scheme `exp://` muda a cada sessão). Link do email → página web simples. Usuário volta pro app manualmente. |
| Duração do token | **24h** | Balance entre UX (tempo pra abrir o email) e segurança. |
| Formato do token | **Hex de 32 bytes aleatórios** (`crypto.randomBytes(32).toString('hex')` → 64 chars) | Entropia alta, URL-safe sem escape. |

---

## 3. Alteração no modelo de dados

### 3.1 Coleção `users` — adicionar campo `emailVerified`

```ts
interface User {
  _id?: ObjectId;
  nome: string;
  email: string;
  senha: string;
  emailVerified: boolean;   // ← novo campo, default false no cadastro
  createdAt: Date;
}
```

**Migração:** usuários já existentes no banco ficam com `emailVerified: undefined`. Tratar `undefined` como `false` na verificação, ou rodar uma migration que seta `emailVerified: true` pra todos os usuários pré-existentes (se houver, já que estamos em dev).

### 3.2 Nova coleção `emailVerificationTokens`

```ts
interface EmailVerificationToken {
  _id?: ObjectId;
  userId: ObjectId;          // referência ao user
  token: string;             // hex de 64 chars (32 bytes)
  expiresAt: Date;           // now + 24h
  createdAt: Date;
}
```

**Índices obrigatórios (criar na inicialização da API, mesmo padrão dos outros):**

```js
// TTL index — auto-deleta quando expiresAt < now
db.collection('emailVerificationTokens').createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Lookup rápido por token na rota de verify
db.collection('emailVerificationTokens').createIndex(
  { token: 1 },
  { unique: true }
);

// Cleanup rápido ao reenviar verification
db.collection('emailVerificationTokens').createIndex({ userId: 1 });
```

---

## 4. Contrato de API

### 4.1 `POST /auth/register` — modificado

**Request body (sem mudança):**
```json
{
  "nome": "Gabriel Prates",
  "email": "gabriel@email.com",
  "senha": "minhasenha123"
}
```

**Nova lógica:**
1. Validar dados (mesmas regras)
2. Hash bcrypt da senha
3. Inserir user com `emailVerified: false`
4. Gerar token de 32 bytes hex
5. Inserir em `emailVerificationTokens` com `expiresAt = now + 24h`
6. Disparar envio de email via SES (async, mas aguardar a conclusão antes de responder para não perder erros)
7. Retornar 201

**Response 201 (mudou):**
```json
{
  "success": true,
  "message": "Conta criada. Verifique seu email para ativar sua conta."
}
```

> ⚠️ **Importante:** ao contrário do comportamento anterior, o register **não retorna mais o JWT**. O usuário precisa verificar o email antes de poder logar.

**Response 409 (sem mudança):**
```json
{ "success": false, "message": "Email já cadastrado" }
```

> **Nota sobre email já cadastrado porém não verificado:** o comportamento recomendado é retornar 409 mesmo assim e orientar o usuário a usar `POST /auth/resend-verification`. Não sobrescrever o user — evita race conditions e mantém a lógica simples.

**Response 500 (novo caso — falha no envio do email):**

Se o SES falhar, **desfazer** a inserção do user e do token (transação ou compensação manual) e retornar:
```json
{ "success": false, "message": "Falha ao enviar email de verificação. Tente novamente em alguns minutos." }
```

---

### 4.2 `GET /auth/verify-email?token=XXX` — novo

**Query params:**
- `token` (obrigatório, string): o token recebido no email

**Response:** SEMPRE `Content-Type: text/html` (nunca JSON). A resposta é consumida por um browser.

**Lógica:**
1. Buscar token em `emailVerificationTokens` (lookup único)
2. Se não encontrado (inexistente ou já expirado, TTL deletou) → retornar HTML de erro "token inválido ou expirado"
3. Se encontrado:
   a. Buscar user correspondente
   b. Atualizar `users.emailVerified = true`
   c. Deletar o token de `emailVerificationTokens`
   d. Retornar HTML de sucesso com o nome do usuário

**HTML sugerido (sucesso):**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email verificado — Rolê SC</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(180deg, #F0F9FF 0%, #DBEAFE 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #001E3C;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 48px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 24px rgba(15,23,42,0.1);
    }
    .icon {
      width: 72px; height: 72px;
      border-radius: 36px;
      background: #DBEAFE;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      color: #1E88E5;
      font-size: 36px;
      font-weight: bold;
    }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #64748B; line-height: 1.5; font-size: 15px; }
    .footer { margin-top: 24px; font-size: 13px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Email verificado!</h1>
    <p>Tudo certo, {{NOME}}. Agora você pode voltar ao app Rolê SC e fazer login.</p>
    <p class="footer">Rolê SC · Eventos do litoral catarinense</p>
  </div>
</body>
</html>
```

**HTML sugerido (erro):** mesma estrutura, trocar ícone `✓` por `✕` em cor `#EF4444`, título por "Link inválido ou expirado" e mensagem explicativa + sugestão de "solicite um novo link no app".

> **Segurança:** aplicar `escapeHtml()` no `{{NOME}}` para evitar XSS. O nome vem do banco mas foi inserido pelo próprio usuário.

---

### 4.3 `POST /auth/login` — modificado

**Request body (sem mudança):**
```json
{ "email": "gabriel@email.com", "senha": "minhasenha123" }
```

**Nova lógica:**
1. Buscar user por email
2. Se não existe → 401
3. `bcrypt.compare` da senha. Se falhar → 401
4. **Se `user.emailVerified !== true`** → **403** com código específico (abaixo)
5. Se tudo OK → gerar JWT e retornar 200 (mesmo shape anterior)

**Response 200 (sem mudança):**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "_id": "...", "nome": "...", "email": "...", "createdAt": "..." }
}
```

**Response 401 (sem mudança):**
```json
{ "success": false, "message": "Email ou senha inválidos" }
```

**Response 403 (NOVO — caso crítico de contrato):**
```json
{
  "success": false,
  "code": "EMAIL_NOT_VERIFIED",
  "message": "Email ainda não verificado. Verifique sua caixa de entrada ou solicite um novo link."
}
```

> ⚠️ **O campo `code` é obrigatório.** O frontend usa ele pra detectar esse caso específico e redirecionar pra tela de "verifique seu email" em vez de mostrar um alert genérico. Sem o código, não dá pra diferenciar de outros 403.

---

### 4.4 `POST /auth/resend-verification` — novo

**Request body:**
```json
{ "email": "gabriel@email.com" }
```

**Validações:**
- `email`: formato válido, obrigatório

**Lógica:**
1. Buscar user por email
2. Se o user **não existe ou já está verificado** → retornar 200 com mensagem genérica (não vazar se o email está cadastrado ou não — protege contra enumeration)
3. Se o user existe e `!emailVerified`:
   a. Deletar tokens antigos desse userId em `emailVerificationTokens`
   b. Gerar novo token (32 bytes hex)
   c. Inserir com `expiresAt = now + 24h`
   d. Enviar email via SES
4. Retornar 200

**Response 200 (sempre, mesmo se email não existe):**
```json
{
  "success": true,
  "message": "Se o email estiver cadastrado e pendente de verificação, você receberá um novo link em alguns minutos."
}
```

**Rate limiting (recomendado):** limitar a **1 reenvio por email a cada 60 segundos** pra evitar abuso. Pode ser implementado checando o `createdAt` do token mais recente antes de gerar novo. Se for `< 60s`, retornar 200 com mesma mensagem genérica (sem reenviar).

---

### 4.5 `GET /auth/me` — sem mudança

Mesmo comportamento, mesmo shape. Como esse endpoint só é chamado com JWT válido (e usuários não-verificados não têm JWT), não precisa verificar `emailVerified` aqui.

Porém, **adicionar `emailVerified` ao payload retornado** para transparência:

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "nome": "...",
    "email": "...",
    "emailVerified": true,
    "createdAt": "..."
  }
}
```

---

## 5. Template do email enviado

```
De: Rolê SC <noreply@...> (ou email pessoal verificado)
Para: {{EMAIL_DO_USUARIO}}
Assunto: Confirme seu email no Rolê SC

Olá, {{NOME}}!

Bem-vindo(a) ao Rolê SC. Pra ativar sua conta e começar a descobrir eventos
no litoral catarinense, clique no link abaixo:

{{URL_BASE}}/auth/verify-email?token={{TOKEN}}

Este link expira em 24 horas. Se você não criou essa conta, ignore este email.

---
Rolê SC · Eventos do litoral catarinense
```

**Versão HTML (recomendada, opcional):** mesma estrutura do HTML da página de verificação, com botão estilizado "Confirmar email" ao invés do link cru.

---

## 6. Variáveis de ambiente novas

Adicionar ao `template.yaml` (SAM) como parâmetros, à `Variables` da função Lambda, e ao `.env` do `invoke-local`:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SES_FROM_EMAIL` | Remetente verificado no SES | `gabriel@outlook.com` |
| `SES_AWS_REGION` | Região do SES (pode ser diferente da Lambda) | `sa-east-1` (ou `us-east-1` se sa-east-1 não tiver SES) |
| `APP_BASE_URL` | Base URL pública da API, usada pra montar o link do email | `https://805tspcek8.execute-api.sa-east-1.amazonaws.com/prod` |

> **Atenção à região do SES:** Brasil (`sa-east-1`) ainda não tem SES como serviço na AWS. **Use `us-east-1`** como região do SES. A Lambda pode continuar em `sa-east-1` sem problema, o SDK é agnóstico de região.

---

## 7. Permissões IAM

Adicionar ao role da Lambda (via `Policies` no `template.yaml`):

```yaml
Policies:
  - Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - ses:SendEmail
          - ses:SendRawEmail
        Resource: '*'
```

Na prática, pode restringir `Resource` ao ARN da identidade verificada, mas `*` é aceitável pro TCC.

---

## 8. Checklist de implementação para o agente do backend

- [ ] Adicionar `emailVerified: boolean` ao tipo `User` em `src/types/user.types.ts`
- [ ] Criar `src/types/emailVerification.types.ts` com a interface `EmailVerificationToken`
- [ ] Criar `src/database/repositories/emailVerification.repository.ts` com: `create`, `findByToken`, `deleteByUserId`, `deleteByToken`, `findLatestByUserId` (pro rate limit)
- [ ] Criar índices de `emailVerificationTokens` na inicialização da conexão (junto com os outros)
- [ ] Instalar `@aws-sdk/client-sesv2`
- [ ] Criar `src/services/email.service.ts` com `sendVerificationEmail(to, nome, token)` usando SES
- [ ] Criar `src/utils/emailVerifyPages.ts` com `renderSuccessPage(nome)` e `renderErrorPage(reason)` + `escapeHtml`
- [ ] Atualizar `src/services/auth.service.ts`:
  - [ ] `register` agora cria token, chama `email.service`, NÃO retorna JWT
  - [ ] Novo método `verifyEmail(token)` → retorna `{ success, user? | reason? }`
  - [ ] `login` agora verifica `emailVerified`, retorna 403 `EMAIL_NOT_VERIFIED` se false
  - [ ] Novo método `resendVerification(email)` com rate limit de 60s
- [ ] Atualizar `src/routes/auth.routes.ts`:
  - [ ] Adicionar `GET /auth/verify-email` que retorna HTML
  - [ ] Adicionar `POST /auth/resend-verification`
  - [ ] Ajustar response schemas dos endpoints modificados
- [ ] Atualizar `src/schemas/auth.schemas.ts` com os novos JSON Schemas
- [ ] Configurar variáveis de ambiente novas (dev + SAM)
- [ ] Adicionar permissão SES ao role IAM no `template.yaml`
- [ ] Atualizar `CONTEXTO_API_BACKEND.md` com os novos endpoints e mudanças
- [ ] Testar manualmente: registrar → receber email → clicar link → verificar → logar

---

## 9. Checklist paralelo do frontend (responsabilidade do agente do frontend — NÃO implementar no backend)

Listado aqui só pra dar transparência ao agente do backend do que está sendo feito do outro lado:

- [ ] Adicionar campo `emailVerified` ao tipo `UserPublic` em `src/types/auth.types.ts`
- [ ] Adicionar `resendVerification(email)` em `src/services/auth.service.ts`
- [ ] Criar nova tela `VerificarEmailScreen` em `src/screens/auth/`
- [ ] Adicionar rota `VerificarEmail` em `AuthNavigator` + `types`
- [ ] Atualizar `AuthContext.signUp`: **não** logar automaticamente mais (só chama register)
- [ ] Atualizar `CadastroScreen`: após sucesso do register, navegar pra `VerificarEmail` passando o email
- [ ] Atualizar `LoginScreen`: detectar `err.response?.data?.code === 'EMAIL_NOT_VERIFIED'` e navegar pra `VerificarEmail`
- [ ] `VerificarEmailScreen` tem: texto explicativo, botão "Reenviar email", botão "Já verifiquei, entrar" (volta pro login)

---

## 10. Princípios que ambos os lados devem respeitar

- **Mensagens de erro nunca vazam enumeration** — ao reenviar verificação, resposta é genérica mesmo se o email não existe
- **Contrato é autoritativo** — se o backend encontrar caso que não está aqui, **pergunta antes de decidir**
- **Campo `code` nas respostas 4xx relevantes** — frontend usa pra branching (começando por `EMAIL_NOT_VERIFIED`; convenção: UPPER_SNAKE_CASE)
- **HTML retornado pelo `/verify-email` é mobile-first** — usuários vão abrir do celular
- **Nenhum token ou senha é logado** — mesmo em dev, `console.log` NUNCA pode imprimir `token`, `senha`, ou headers `Authorization`

---

## 11. Pontos em aberto (decidir se aparecer)

- **Expiração do token usado vs. TTL do Mongo**: o TTL roda a cada ~60s, então um token expirado pode ficar no banco por até 60s antes de ser deletado. A rota `verify-email` deve verificar `expiresAt > now` explicitamente ao invés de confiar só no TTL. Isso já está implícito no checklist acima.
- **E-mails em produção (sair do sandbox SES):** fora do escopo desta fase. Deixar documentado como próximo passo no roadmap da API.
- **Logout do token JWT na mudança de email:** não há mudança de email nesta fase (tela de editar perfil está desabilitada no app). Quando for implementar, reiniciar o fluxo de verificação.

---

*Documento v1 — criado por Gabriel Prates em conjunto com o agente do frontend. Qualquer mudança requer comunicação entre os dois lados.*
