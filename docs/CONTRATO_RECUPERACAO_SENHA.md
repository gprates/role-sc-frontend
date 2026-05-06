# Contrato de integração — Recuperação de Senha

Documento compartilhado entre o agente do **backend** (`api`) e o agente do **frontend** (`role-sc-frontend`). Define a arquitetura, o contrato de API e as responsabilidades de cada lado para a funcionalidade de recuperação de senha do Rolê SC.

> **Para o agente de backend:** esse é o documento autoritativo. O frontend já está implementado e funcional, esperando os endpoints. Qualquer divergência deve ser discutida antes de implementar — não ajuste o contrato unilateralmente.

> Documento irmão: `CONTRATO_VERIFICACAO_EMAIL.md`. Os padrões (TTL no MongoDB, AWS SES, antienumeration, códigos de erro) são os mesmos. Releia antes se tiver dúvida.

---

## 1. Contexto

O Rolê SC tem hoje cadastro com verificação de email (já implementado/contratado). Falta agora permitir que um usuário **redefina sua senha** caso a tenha esquecido.

O fluxo escolhido é por **código de 6 dígitos enviado por email** — não por link clicável. Razões:

- Mantém o usuário **dentro do app** o tempo todo (melhor UX em mobile)
- Evita a complexidade de deep linking (que com Expo Go fica frágil)
- Códigos de 6 dígitos são fáceis de digitar, e Android/iOS oferecem auto-fill via `autoComplete="one-time-code"` quando o email do código é interpretado pelo sistema

---

## 2. Decisões arquiteturais (já fechadas)

| Decisão | Escolhido | Por quê |
|---------|-----------|---------|
| Mecanismo de validação | **Código de 6 dígitos numérico**, digitado no app | UX mobile-friendly, sem deep linking, auto-fill possível |
| Storage do código | **MongoDB com TTL index** (coleção `passwordResetCodes`) | Mesmo padrão da verificação de email |
| Storage do reset token (após validar o código) | **MongoDB com TTL index** (coleção `passwordResetTokens`) | Separação de concerns: o código é só pra "provar que você é dono do email", o token é a credencial de uso único pra trocar a senha |
| TTL do código | **15 minutos** | Curto pra reduzir janela de ataque; longo o suficiente pra UX (chegar email, abrir, copiar) |
| TTL do reset token | **15 minutos a partir da geração** | Idem |
| Rate limit do envio (mesmo email) | **60 segundos entre requests** | Evita spam/abuso do SES |
| Reuso de código/token | **Single-use** — ambos são deletados após uso | Padrão de segurança |
| Força de senha | Mínimo 8 chars + 1 maiúscula + 1 minúscula + 1 dígito + 1 caractere especial | Validado client-side e server-side |
| Comportamento quando email não cadastrado em `forgot-password` | **Retornar 404 com `code: USER_NOT_FOUND`** | Decisão pragmática do dono do produto: app de eventos locais não tem o mesmo perfil de risco de um banco. UX explícita ("email não cadastrado, quer criar conta?") vale mais que proteção contra enumeration. |
| Validação do código | `verify-reset-code` retorna erro específico (`INVALID_RESET_CODE`) | Caso contrário o usuário ficaria preso no fluxo (UX inviável) |
| Email de notificação ao trocar senha | **Sim, enviar** — informar que a senha foi alterada | Ajuda o usuário detectar comprometimento |

---

## 3. Alterações no modelo de dados

### 3.1 Coleção `users` — sem mudança no schema

A senha continua sendo `senha: string` (hash bcrypt). O `reset-password` apenas atualiza esse campo.

### 3.2 Nova coleção `passwordResetCodes`

```ts
interface PasswordResetCode {
  _id?: ObjectId;
  userId: ObjectId;          // referência ao user
  code: string;              // 6 dígitos numéricos, ex: "374829"
  expiresAt: Date;           // now + 15min
  createdAt: Date;
}
```

**Índices obrigatórios:**

```js
db.collection('passwordResetCodes').createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
db.collection('passwordResetCodes').createIndex({ userId: 1 });
```

> **Lookup:** sempre por `(userId, code)`, **não** por `code` sozinho. Códigos curtos (6 dígitos = 1M possibilidades) não devem ser globalmente únicos — buscar só por `code` permitiria brute force trivial.

### 3.3 Nova coleção `passwordResetTokens`

```ts
interface PasswordResetToken {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;             // hex de 64 chars (32 bytes), igual ao token de verificação de email
  expiresAt: Date;           // now + 15min
  createdAt: Date;
}
```

**Índices obrigatórios:**

```js
db.collection('passwordResetTokens').createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
db.collection('passwordResetTokens').createIndex(
  { token: 1 },
  { unique: true }
);
```

---

## 4. Contrato de API

### 4.1 `POST /auth/forgot-password` — novo

Inicia o fluxo. **Não tem antienumeration** — se o email não está cadastrado, retornamos 404 explícito (decisão do dono do produto, ver seção 2).

**Request body:**
```json
{ "email": "gabriel@email.com" }
```

**Validações:**
- `email`: formato válido, obrigatório

**Lógica:**
1. Buscar user por email (lowercase)
2. **Se user não existe** → retornar **404** com `code: USER_NOT_FOUND` (ver shape abaixo). Nada é gravado, nenhum email enviado.
3. **Se user existe mas `!emailVerified`** → retornar **403** com `code: EMAIL_NOT_VERIFIED` (mesmo código já usado em `/auth/login`). Faz sentido: a recuperação só faz sentido pra contas que já validaram o email originalmente.
4. Se user existe e está verificado:
   a. Verificar rate limit (último código gerado há menos de 60s? Retornar 200 com mensagem amigável tipo "código já enviado, aguarde antes de pedir outro" — mas SEM reenviar).
   b. Deletar códigos antigos desse `userId` (cleanup)
   c. Gerar código de 6 dígitos numéricos. **Usar `crypto.randomInt(100000, 1000000)`** — `Math.random()` não é criptograficamente seguro.
   d. Inserir em `passwordResetCodes` com `expiresAt = now + 15min`
   e. Enviar email via SES com o código (ver seção 5.1)
5. Retornar 200

**Response 200 (sucesso):**
```json
{
  "success": true,
  "message": "Código enviado para o seu email."
}
```

**Response 404 (email não cadastrado):**
```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "Não encontramos uma conta com esse email."
}
```

**Response 403 (conta existe mas não verificada):**
```json
{
  "success": false,
  "code": "EMAIL_NOT_VERIFIED",
  "message": "Verifique seu email antes de redefinir a senha."
}
```

> ⚠️ Como NÃO temos antienumeration aqui, é importante que esse endpoint tenha **rate limit por IP** (ex: 10 requests por minuto por IP), mesmo que ainda não exista — pra dificultar enumeration em massa por scraping. **Anotar como follow-up** se ainda não estiver implementado em outros endpoints.

**Email enviado:** ver seção 5.

---

### 4.2 `POST /auth/verify-reset-code` — novo

Valida o código digitado pelo usuário. Em sucesso, retorna um `resetToken` que será usado para de fato trocar a senha.

**Request body:**
```json
{
  "email": "gabriel@email.com",
  "code": "374829"
}
```

**Validações:**
- `email`: formato válido, obrigatório
- `code`: string de exatamente 6 dígitos numéricos

**Lógica:**
1. Buscar user por email
2. Se user não existe → retornar 400 com `code: INVALID_RESET_CODE` (mesmo erro de "código errado", pra não vazar)
3. Buscar `passwordResetCodes` por `(userId, code)` com `expiresAt > now`
4. Se não encontrado → 400 com `code: INVALID_RESET_CODE`
5. Se encontrado:
   a. Deletar o código (single-use)
   b. Deletar tokens antigos desse `userId` em `passwordResetTokens`
   c. Gerar `resetToken` (hex de 32 bytes — `crypto.randomBytes(32).toString('hex')`)
   d. Inserir em `passwordResetTokens` com `expiresAt = now + 15min`
   e. Retornar 200 com o token

**Response 200:**
```json
{
  "success": true,
  "resetToken": "a1b2c3d4...64chars"
}
```

**Response 400 (código errado/expirado):**
```json
{
  "success": false,
  "code": "INVALID_RESET_CODE",
  "message": "Código inválido ou expirado."
}
```

> ⚠️ **O campo `code` é obrigatório.** O frontend usa pra mostrar mensagem específica e limpar o input pro usuário tentar de novo. Sem o código, não dá pra diferenciar de outros 400.

---

### 4.3 `POST /auth/reset-password` — novo

Efetiva a troca de senha. Exige um `resetToken` válido (obtido em verify-reset-code).

**Request body:**
```json
{
  "email": "gabriel@email.com",
  "resetToken": "a1b2c3d4...64chars",
  "novaSenha": "MinhaNovaSenh@123"
}
```

**Validações:**
- `email`: obrigatório
- `resetToken`: string, obrigatório
- `novaSenha`: validada server-side com as MESMAS regras do client:
  - Mínimo 8 caracteres
  - Pelo menos 1 letra maiúscula `[A-Z]`
  - Pelo menos 1 letra minúscula `[a-z]`
  - Pelo menos 1 dígito `[0-9]`
  - Pelo menos 1 caractere especial `[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]`

**Lógica:**
1. Buscar user por email. Se não existe → 400 com `code: INVALID_RESET_TOKEN`.
2. Buscar `passwordResetTokens` por `(userId, token)` com `expiresAt > now`. Se não encontrado → 400 com `code: INVALID_RESET_TOKEN`.
3. Validar força da `novaSenha` (regex acima). Se falhar → 400 com `code: WEAK_PASSWORD`.
4. Hash bcrypt da nova senha (10 rounds, igual ao register).
5. Atualizar `users.senha = novoHash`.
6. Deletar TODOS os tokens E códigos pendentes desse `userId` (cleanup completo, evita reuso).
7. **Enviar email de notificação** "sua senha foi alterada" via SES (não bloqueante — log se falhar mas não falha a request).
8. Retornar 200.

**Response 200:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso."
}
```

**Response 400 (token inválido/expirado):**
```json
{
  "success": false,
  "code": "INVALID_RESET_TOKEN",
  "message": "O processo de recuperação expirou. Solicite um novo código."
}
```

**Response 400 (senha fraca):**
```json
{
  "success": false,
  "code": "WEAK_PASSWORD",
  "message": "A senha não cumpre todos os requisitos de segurança."
}
```

---

## 5. Templates de email

### 5.1 Email com código de recuperação (forgot-password)

```
De: Rolê SC <no-reply@role-sc.com.br>
Para: {{EMAIL}}
Assunto: Seu código de recuperação Rolê SC

Olá, {{NOME}}!

Recebemos uma solicitação para redefinir a senha da sua conta no Rolê SC.

Seu código de recuperação é:

  {{CODIGO}}

Esse código é válido por 15 minutos. Se você não solicitou essa recuperação,
pode ignorar este email com segurança.

---
Rolê SC · Eventos do litoral catarinense
```

**Versão HTML (recomendada):** caixa centralizada com o código em fonte grande, cor primária do app (`#1E88E5`), botão visual em vez de monospace.

> 💡 **Dica de UX no email:** colocar o código no **assunto** (`Seu código Rolê SC: 374829`) ajuda algumas funcionalidades de auto-detect dos apps de email mobile.

### 5.2 Email de notificação de troca de senha (reset-password)

```
De: Rolê SC <no-reply@role-sc.com.br>
Para: {{EMAIL}}
Assunto: Sua senha do Rolê SC foi alterada

Olá, {{NOME}}!

A senha da sua conta no Rolê SC acabou de ser alterada.

Se foi você, pode ignorar este email.

Se NÃO foi você, sua conta pode estar comprometida. Acesse o app
imediatamente, redefina a senha e considere trocá-la em outros serviços
onde você usa a mesma senha.

---
Rolê SC · Eventos do litoral catarinense
```

> Esse email é uma boa prática de segurança (detecta comprometimento). Não é bloqueante — se o SES falhar, log o erro mas retorne sucesso pro reset-password (a senha JÁ foi trocada com sucesso).

---

## 6. Variáveis de ambiente

Nenhuma nova variável é necessária. Reusa as do `CONTRATO_VERIFICACAO_EMAIL.md`:

- `SES_FROM_EMAIL`
- `SES_AWS_REGION`
- `MONGODB_URI`, `MONGODB_DB_NAME`

---

## 7. Permissões IAM

Sem mudança — já cobertas pelo contrato de verificação de email (`ses:SendEmail`, `ses:SendRawEmail`).

---

## 8. Checklist de implementação para o agente do backend

- [ ] Criar `src/types/passwordReset.types.ts` com interfaces `PasswordResetCode` e `PasswordResetToken`
- [ ] Criar repositórios:
  - [ ] `src/database/repositories/passwordResetCode.repository.ts` — `create`, `findByUserAndCode`, `deleteByUserId`, `findLatestByUserId` (pro rate limit)
  - [ ] `src/database/repositories/passwordResetToken.repository.ts` — `create`, `findByToken`, `deleteByUserId`
- [ ] Criar índices das duas coleções na inicialização
- [ ] Atualizar `src/services/email.service.ts`:
  - [ ] Novo método `sendResetCodeEmail(to, nome, code)`
  - [ ] Novo método `sendPasswordChangedEmail(to, nome)`
- [ ] Atualizar `src/services/auth.service.ts`:
  - [ ] Novo método `forgotPassword(email)` com rate limit + geração de código
  - [ ] Novo método `verifyResetCode(email, code)` retornando `{ resetToken }`
  - [ ] Novo método `resetPassword(email, resetToken, novaSenha)` com validação de força + hash + cleanup + notificação
- [ ] Criar `src/utils/passwordValidator.ts` com a mesma regex do frontend (manter em sincronia)
- [ ] Atualizar `src/routes/auth.routes.ts`:
  - [ ] `POST /auth/forgot-password`
  - [ ] `POST /auth/verify-reset-code`
  - [ ] `POST /auth/reset-password`
- [ ] Atualizar `src/schemas/auth.schemas.ts` com os JSON Schemas dos 3 endpoints
- [ ] Atualizar `CONTEXTO_API_BACKEND.md` adicionando os 3 endpoints
- [ ] Testar manualmente o fluxo completo: forgot → verify → reset → login com nova senha

---

## 9. Status do frontend (já implementado)

Listado para transparência — **não implementar no backend**:

- ✅ `src/utils/password.ts` — validador de força (mesma regex do contrato server-side)
- ✅ `src/components/PasswordStrengthMeter.tsx` — checklist visual ao vivo
- ✅ `src/types/auth.types.ts` — tipos + códigos de erro `INVALID_RESET_CODE`, `INVALID_RESET_TOKEN`, `WEAK_PASSWORD`
- ✅ `src/services/auth.service.ts` — `forgotPassword`, `verifyResetCode`, `resetPassword`
- ✅ `src/screens/auth/RecuperarSenhaScreen.tsx` — recebe email, chama forgot-password, navega
- ✅ `src/screens/auth/ConfirmarCodigoScreen.tsx` — input de 6 dígitos, reenvio com cooldown 60s
- ✅ `src/screens/auth/RedefinirSenhaScreen.tsx` — strength meter + confirmação visual
- ✅ Cadastro também usa o mesmo validador (consistência)

Comportamento esperado do app frente aos códigos:

| Status / `code` | Comportamento do app |
|-----------------|----------------------|
| `200` em `forgot-password` | Navega pra ConfirmarCodigo |
| `404 USER_NOT_FOUND` em `forgot-password` | Alert "Email não encontrado" com 2 opções: "Tentar outro email" / "Criar conta" (último navega pra Cadastro com email pré-preenchido) |
| `403 EMAIL_NOT_VERIFIED` em `forgot-password` | (a tratar) — provavelmente alert "Verifique seu email primeiro" com atalho pra `VerificarEmail` |
| `200` em `verify-reset-code` | Salva resetToken, navega pra RedefinirSenha |
| `400 INVALID_RESET_CODE` | Alert "Código inválido ou expirado", limpa input, refoca |
| `200` em `reset-password` | Alert sucesso, navega pra Login |
| `400 INVALID_RESET_TOKEN` | Alert "expirou", navega pra RecuperarSenha (recomeça) |
| `400 WEAK_PASSWORD` | Mostra `extractErrorMessage` (nunca deveria chegar aqui — client valida antes) |

---

## 10. Princípios que ambos os lados devem respeitar

- **Sem antienumeration em `forgot-password`** — decisão consciente do dono do produto, ver seção 2. O endpoint retorna 404 explícito quando o email não existe. Compensação: rate limit por IP é desejável (anotado como follow-up).
- **Antienumeration mantido em `verify-reset-code` e `reset-password`** — quando o usuário já passou pela primeira tela e está com um código/token em mãos, não tem mais ganho de segurança em esconder informação dele.
- **Códigos NUNCA são logados** — nem em `console.log` server-side, nem em logs estruturados. Mesma regra pra `resetToken` e `senha`.
- **Validação server-side é obrigatória** — não confiar em validação client-side. Se o front enviar senha fraca por bug ou bypass, o backend tem que rejeitar.
- **Cleanup agressivo após uso** — quando um código é validado, deletar não só ele mas todos os outros do mesmo `userId`. Idem pra tokens após reset bem-sucedido. Evita reuso e mantém o banco limpo.
- **Rate limit por email aplicável** — 60s entre requests de `forgot-password` pro mesmo email. Em caso de exceder, retorna 200 com mensagem amigável "código já enviado, aguarde" mas SEM efetivamente reenviar.
- **Email de notificação não bloqueia** — se falhar o SES no `reset-password`, ainda assim retornar 200. A senha já foi trocada com sucesso.

---

## 11. Pontos em aberto (decidir se aparecer)

- **Invalidação de sessões existentes ao trocar senha**: idealmente, ao redefinir senha, todos os JWTs ativos do usuário deveriam ser invalidados. Hoje não temos blacklist de JWT (são stateless). Decisão pragmática: **não implementar invalidação nesta fase**. Próximo passo seria adicionar `tokenVersion: number` ao user e incluir no JWT payload — incrementa no reset, valida no auth.hook.
- **Rate limit por IP em forgot-password**: como decidimos não ter antienumeration nesse endpoint, alguém com uma lista de emails poderia teoricamente verificar quais existem na nossa base disparando requests em massa. O rate limit por email (60s) ajuda mas não cobre. Implementar rate limit por IP (ex: 10 req/min) é a próxima camada — não é bloqueante pra essa fase mas vale fazer antes de ir pra produção pública.
- **Captcha / proteção contra bots em forgot-password**: defesa adicional contra abuso de SES (custo) e enumeration. Por enquanto, rate limit + quotas SES dão proteção suficiente. Anotar como follow-up se virar problema real.
- **Histórico de senhas (não permitir reuso)**: fora do escopo. Se for adicionar no futuro, criar coleção `passwordHistory` com últimos N hashes.

---

*Documento v1 — criado em conjunto pelo agente do frontend após implementação. Qualquer mudança requer comunicação entre os dois lados.*
