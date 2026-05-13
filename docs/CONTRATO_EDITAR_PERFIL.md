# Contrato de integração — Editar Perfil

Documento compartilhado entre o agente do **backend** (`api`) e o agente do **frontend** (`role-sc-frontend`). Define o endpoint pra alteração de dados de perfil do usuário logado no Rolê SC.

> **Para o agente de backend:** esse é o documento autoritativo. O frontend já está implementado e funcional, esperando o endpoint. Qualquer divergência deve ser discutida antes de implementar.

> Documentos irmãos: `CONTRATO_VERIFICACAO_EMAIL.md`, `CONTRATO_RECUPERACAO_SENHA.md`, `CONTRATO_ALTERAR_SENHA.md`, `CONTRATO_AVATAR.md`. Padrões (códigos de erro, princípios) são os mesmos.

---

## 1. Contexto

Hoje o app tem uma tela "Editar perfil" stub que pede nome e email mas o botão de salvar está desabilitado ("Em breve").

A decisão de produto é: **nesta fase, só permitir alterar o NOME**. O email continua imutável após o cadastro porque alterá-lo exigiria um novo fluxo de verificação (envio de código pro novo email, validação, etc), e está fora do escopo atual.

Avatar tem o seu próprio fluxo separado (`CONTRATO_AVATAR.md`), não passa por esse endpoint.

---

## 2. Decisões arquiteturais

| Decisão | Escolhido | Por quê |
|---------|-----------|---------|
| Verbo HTTP | **PATCH** (parcial), não PUT | Apenas um subconjunto dos campos do user pode ser alterado. PATCH expressa isso semanticamente. |
| Endpoint path | `/users/me` | Coerente com a convenção REST: `/users/me/avatar/...` já existe pelo `CONTRATO_AVATAR.md`. Esse passa a ser o "namespace" do user logado. |
| Campos alteráveis nesta fase | **Apenas `nome`** | Email exige novo fluxo de verificação (não escopo agora). Senha tem fluxo próprio. Avatar tem fluxo próprio. |
| Resposta | **Retorna o user atualizado completo** (formato `UserPublic`) | Frontend usa pra atualizar `AuthContext` via `patchUser(res.user)` sem refazer `getMe` |
| Trim do nome | **Backend deve trimar** antes de salvar | Defesa em profundidade. Frontend já trima também. |
| Validação | Mesma do register (`nome >= 2 chars` ) + limite superior (80 chars) | Consistência com o cadastro |

---

## 3. Alterações no modelo de dados

**Nenhuma.** Reusa a coleção `users` existente. Apenas atualiza o campo `nome`.

---

## 4. Contrato de API

### 4.1 `PATCH /users/me` — novo

Atualiza dados parciais do usuário logado. Endpoint protegido por JWT.

**Headers obrigatórios:**
```
Authorization: Bearer <jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "nome": "Gabriel Prates"
}
```

**Validações:**
- `nome`: string, obrigatória, mínimo 2 caracteres (após trim), máximo 80 caracteres
- Body com campos extras (ex: `email`, `senha`): **rejeitar 400** ou ignorar silenciosamente. Recomendado **rejeitar** com `additionalProperties: false` no JSON Schema, pra deixar explícito que esses campos não são editáveis aqui.

**Lógica:**
1. Extrair `userId` do JWT (via `auth.hook`)
2. Validar body (Fastify faz via JSON Schema)
3. Trim do `nome`
4. Atualizar `users.nome = nomeTrimmed`
5. Buscar o user atualizado
6. Retornar 200 com o user no formato `UserPublic` (sem `senha`)

**Response 200:**
```json
{
  "success": true,
  "user": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "nome": "Gabriel Prates",
    "email": "gabriel@email.com",
    "emailVerified": true,
    "avatarUrl": "https://...?v=...",
    "createdAt": "2026-04-14T12:00:00.000Z"
  }
}
```

**Response 400 (validação):**
```json
{
  "success": false,
  "message": "body/nome must NOT have fewer than 2 characters"
}
```
(formato padrão do Fastify; o frontend já mostra via `extractErrorMessage`)

**Response 401:**
```json
{
  "success": false,
  "message": "Token inválido ou ausente."
}
```

---

## 5. Variáveis de ambiente

Nenhuma nova.

---

## 6. Permissões IAM

Nenhuma nova.

---

## 7. Checklist de implementação para o agente do backend

- [ ] Adicionar `UpdateProfileBody` em `src/types/auth.types.ts` (ou criar `user.types.ts`)
- [ ] Atualizar `src/services/auth.service.ts` (ou criar `user.service.ts`):
  - [ ] Novo método `updateProfile(userId, { nome })`
- [ ] Atualizar `src/routes/users.routes.ts` (criado em CONTRATO_AVATAR.md):
  - [ ] `PATCH /users/me` com preHandler de autenticação
- [ ] Atualizar `src/schemas/user.schemas.ts` com JSON Schema:
  - `additionalProperties: false` no body
  - `nome`: minLength 2, maxLength 80
- [ ] Atualizar `CONTEXTO_API_BACKEND.md` com o novo endpoint
- [ ] Testar manualmente: editar nome no app → conferir no banco → conferir que `GET /auth/me` retorna o novo nome

---

## 8. Status do frontend (já implementado)

- ✅ `src/types/auth.types.ts` — tipos `UpdateProfileBody` e `UpdateProfileResponse`
- ✅ `src/services/auth.service.ts` — método `updateProfile(nome)`
- ✅ `src/screens/perfil/EditarPerfilScreen.tsx` — refatorada:
  - Campo de email removido (não pode mais ser editado) — exibido como **read-only** com ícone de cadeado e texto explicativo
  - Campo de nome funcional, com validação inline (2-80 chars)
  - `autoFocus` no campo de nome
  - Botão muda de "Salvar alterações" → "Voltar" quando o usuário não mudou nada (UX: evita request desnecessária)
  - Após sucesso, chama `patchUser(res.user)` do `AuthContext` (refletindo instantaneamente em outras telas)

---

## 9. Princípios

- **Email não é editável aqui** — quando virar editável, será via novo endpoint `POST /users/me/change-email-request` que inicia fluxo de verificação separado. Não retro-adicionar email a esse endpoint.
- **Trim antes de salvar** — sempre. Frontend já trima, backend deve trimar de novo.
- **`additionalProperties: false`** — explicitamente rejeitar campos não permitidos. Evita "deslizes" futuros (ex: frontend bugado mandar `senha` por engano).
- **Resposta retorna o user completo** — frontend não precisa fazer um `getMe` extra pra ver o nome novo refletido.

---

## 10. Pontos em aberto (decisão futura)

- **Alteração de email**: quando implementar, sugestão de fluxo:
  1. `POST /users/me/change-email-request` body `{ novoEmail }` → backend valida formato + se já não está em uso + envia código pro NOVO email
  2. `POST /users/me/change-email-confirm` body `{ novoEmail, code }` → backend valida código e troca email no user
  3. Importante: enviar email de notificação pro email ANTIGO também ("seu email foi alterado") como segurança
- **Outros campos editáveis no futuro**: bio, telefone, etc. Quando aparecer, basta estender o `PATCH /users/me` (e o JSON Schema), o frontend só precisa adicionar campos na tela.
- **Histórico de alterações de nome**: se virar requisito (ex: prevenir abuso de impersonation), adicionar coleção `userProfileHistory`. Fora do escopo agora.

---

*Documento v1 — criado pelo agente do frontend após implementação. Qualquer mudança requer comunicação entre os dois lados.*
