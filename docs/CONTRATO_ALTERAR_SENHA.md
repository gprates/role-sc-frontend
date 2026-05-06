# Contrato de integração — Alterar Senha (usuário logado)

Documento compartilhado entre o agente do **backend** (`api`) e o agente do **frontend** (`role-sc-frontend`). Define a arquitetura, o contrato de API e as responsabilidades de cada lado para a funcionalidade de alteração de senha por usuário **autenticado** no Rolê SC.

> **Para o agente de backend:** esse é o documento autoritativo. O frontend já está implementado e funcional, esperando o endpoint. Qualquer divergência deve ser discutida antes de implementar — não ajuste o contrato unilateralmente.

> Documentos irmãos: `CONTRATO_VERIFICACAO_EMAIL.md` e `CONTRATO_RECUPERACAO_SENHA.md`. Os padrões (validação de força de senha, AWS SES, códigos de erro) são os mesmos. Releia se tiver dúvida.

---

## 1. Contexto

Diferente da **recuperação de senha** (usuário esqueceu, fluxo por email com código), a **alteração de senha** é feita por um usuário que já está **logado** e quer trocar a senha por outra (motivos: rotação de segurança, suspeita de comprometimento, simplesmente quis mudar).

A diferença prática:
- **Recuperação:** prova de identidade = acesso ao email (código enviado)
- **Alteração:** prova de identidade = JWT válido + conhecimento da **senha atual**

A senha atual é exigida porque o JWT sozinho não é prova suficiente — se o token vazar (celular roubado, etc), o atacante não pode trocar a senha sem conhecer a senha atual, dando uma janela de defesa.

---

## 2. Decisões arquiteturais

| Decisão | Escolhido | Por quê |
|---------|-----------|---------|
| Endpoint protegido | **Sim, exige JWT válido** | Padrão de qualquer rota autenticada |
| Prova de identidade adicional | **Senha atual no body** | Defesa em profundidade contra JWT vazado |
| Força de senha | **Mesmas regras** dos outros fluxos: 8 chars, 1 maiúscula, 1 minúscula, 1 dígito, 1 especial | Consistência |
| Senha nova ≠ senha atual | **Validar (server-side e client-side)** | Evita "trocar" sem trocar nada |
| Email de notificação | **Sim, enviar** "sua senha foi alterada" | Igual ao reset-password — ajuda detectar comprometimento |
| Invalidação de sessões existentes | **NÃO invalidar** (decisão pragmática) | JWTs são stateless; implementar blacklist é over-engineering pro escopo. Ver seção 11. |
| Rate limit | **Opcional, leve** (ex: 5 tentativas / 5min por user) | Defesa contra brute-force da senha atual |

---

## 3. Alterações no modelo de dados

**Nenhuma.** Reusa a coleção `users` existente. Apenas atualiza o campo `senha` (hash bcrypt).

Não cria nenhuma coleção auxiliar (diferente de recovery, que precisa de `passwordResetCodes` e `passwordResetTokens`).

---

## 4. Contrato de API

### 4.1 `POST /auth/change-password` — novo

Altera a senha do usuário logado. Endpoint protegido por JWT (mesmo `auth.hook` usado em `/auth/me`).

**Headers obrigatórios:**
```
Authorization: Bearer <jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "senhaAtual": "MinhaSenha@123",
  "novaSenha": "NovaSenh@456"
}
```

**Validações de schema:**
- `senhaAtual`: string, obrigatória, mínimo 1 caractere (não validamos força aqui — é só o que o user tem)
- `novaSenha`: string, obrigatória, validar força com a MESMA regex dos outros fluxos:
  - Mínimo 8 caracteres
  - Pelo menos 1 letra maiúscula `[A-Z]`
  - Pelo menos 1 letra minúscula `[a-z]`
  - Pelo menos 1 dígito `[0-9]`
  - Pelo menos 1 caractere especial `[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]`

**Lógica:**
1. Extrair `userId` do JWT (já feito pelo `auth.hook`)
2. Buscar user por `_id`. Se não encontrado → 401 (caso defensivo, normalmente impossível).
3. Validar `bcrypt.compare(senhaAtual, user.senha)`. Se falhar → **400** com `code: INVALID_CURRENT_PASSWORD`.
4. Validar força da `novaSenha`. Se falhar → **400** com `code: WEAK_PASSWORD`.
5. Validar que `novaSenha !== senhaAtual` (comparar plaintext, antes do hash). Se igual → **400** com `code: WEAK_PASSWORD` e mensagem específica "A nova senha não pode ser igual à atual" (ou criar `code: SAME_PASSWORD` se preferir distinguir — opcional).
6. Hash bcrypt da nova senha (10 rounds).
7. Atualizar `users.senha = novoHash`.
8. **Enviar email de notificação** "sua senha foi alterada" via SES (mesmo template do reset-password — pode até reusar a função `sendPasswordChangedEmail`). Não bloqueante: log se falhar mas retorna sucesso pra request.
9. Retornar 200.

**Response 200:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso."
}
```

**Response 400 (senha atual incorreta):**
```json
{
  "success": false,
  "code": "INVALID_CURRENT_PASSWORD",
  "message": "Senha atual incorreta."
}
```

**Response 400 (nova senha fraca ou igual à atual):**
```json
{
  "success": false,
  "code": "WEAK_PASSWORD",
  "message": "A senha não cumpre todos os requisitos de segurança."
}
```

**Response 401 (sem JWT ou JWT inválido):**
```json
{
  "success": false,
  "message": "Token inválido ou ausente."
}
```

> ⚠️ **O campo `code` é obrigatório.** O frontend usa pra distinguir "senha atual errada" (limpa só esse campo) de "outros erros" (mostra alert genérico).

---

## 5. Templates de email

### 5.1 Email de notificação de troca de senha

**Reusar exatamente o mesmo template do CONTRATO_RECUPERACAO_SENHA.md, seção 5.2.** Não precisa criar novo. Mensagem genérica "sua senha foi alterada" funciona pros dois fluxos (recuperação ou alteração logada).

Se quiser variar o assunto/copy pra deixar claro que foi voluntário:

```
Assunto: Sua senha do Rolê SC foi alterada

Olá, {{NOME}}!

A senha da sua conta no Rolê SC acabou de ser alterada via app
(usuário logado).

Se foi você, pode ignorar este email.

Se NÃO foi você, sua conta pode estar comprometida. Acesse o app
imediatamente, redefina a senha e considere trocá-la em outros serviços
onde você usa a mesma senha.

---
Rolê SC · Eventos do litoral catarinense
```

Mas reusar o template do reset-password também é totalmente válido. Decisão de UX/escopo do backend.

---

## 6. Variáveis de ambiente

Nenhuma nova. Reusa as do `CONTRATO_VERIFICACAO_EMAIL.md`.

---

## 7. Permissões IAM

Sem mudança. Já cobertas (`ses:SendEmail`).

---

## 8. Checklist de implementação para o agente do backend

- [ ] Adicionar tipo `ChangePasswordBody` em `src/types/auth.types.ts` (se ainda não houver)
- [ ] Atualizar `src/services/auth.service.ts`:
  - [ ] Novo método `changePassword(userId, senhaAtual, novaSenha)` com toda a lógica da seção 4.1
- [ ] Atualizar `src/routes/auth.routes.ts`:
  - [ ] Novo endpoint `POST /auth/change-password` com `preHandler` de autenticação (mesmo hook que `/auth/me`)
- [ ] Atualizar `src/schemas/auth.schemas.ts` com o JSON Schema do body
- [ ] Reusar `src/utils/passwordValidator.ts` (criado em CONTRATO_RECUPERACAO_SENHA)
- [ ] Reusar `email.service.sendPasswordChangedEmail` (criado em CONTRATO_RECUPERACAO_SENHA)
- [ ] Atualizar `CONTEXTO_API_BACKEND.md` adicionando o novo endpoint
- [ ] Testar manualmente: logar → alterar senha → fazer logout → logar com nova senha → ✓

---

## 9. Status do frontend (já implementado)

Listado para transparência — **não implementar no backend**:

- ✅ `src/types/auth.types.ts` — tipo `ChangePasswordBody`/`Response` + código `INVALID_CURRENT_PASSWORD`
- ✅ `src/services/auth.service.ts` — método `changePassword(senhaAtual, novaSenha)` (JWT injetado pelo interceptor)
- ✅ `src/screens/perfil/AlterarSenhaScreen.tsx` — refatorada de stub pra funcional, com:
  - 3 inputs (senha atual, nova, confirmar)
  - Strength meter ao vivo na nova senha (mesmo componente reusado)
  - Detecção de "nova == atual" com feedback visual antes do submit
  - Tratamento específico de `INVALID_CURRENT_PASSWORD` (limpa só o campo da senha atual, não os outros)
  - Botão desabilitado até todos os requisitos passarem

Comportamento esperado do app frente aos códigos:

| Status / `code` | Comportamento do app |
|-----------------|----------------------|
| `200` | Alert "Senha alterada com sucesso", `goBack()` pra Perfil |
| `400 INVALID_CURRENT_PASSWORD` | Alert "Senha atual incorreta", limpa o campo `senhaAtual`, mantém os outros preenchidos |
| `400 WEAK_PASSWORD` | Mostra `extractErrorMessage` (não deveria chegar aqui — client valida antes) |
| `401` | Tratado pelo interceptor global da API: força logout via `setUnauthorizedHandler` |
| Outros | Alert genérico com `extractErrorMessage` |

---

## 10. Princípios que ambos os lados devem respeitar

- **Senha atual NUNCA é logada** — nem em `console.log` server-side, nem em logs estruturados. Mesma regra pra `novaSenha`.
- **Validação server-side é obrigatória** — não confiar no client. Se o front mandar senha fraca por bug ou bypass, backend rejeita.
- **`bcrypt.compare` é constant-time** — usar essa função, NÃO comparar strings com `===`. Já é o padrão da lib, mas vale lembrar.
- **Email de notificação não bloqueia** — se SES falhar, ainda assim retorna 200. A senha já foi trocada com sucesso.
- **Não vazar diferença entre "user não encontrado" e "senha errada"** — caso defensivo de userId no JWT apontar pra user inexistente é raríssimo, mas se acontecer, retornar 401 (não 400 INVALID_CURRENT_PASSWORD), pra o frontend forçar logout via interceptor.

---

## 11. Pontos em aberto (decididos)

- **Invalidação de sessões existentes ao trocar senha (alterar OU resetar)**: hoje **não implementamos**. Os JWTs ativos continuam válidos depois da troca de senha. Implicação: se alguém estiver logado com JWT vazado e o usuário trocar a senha, o atacante continua logado até o JWT expirar (7 dias).
  - Solução padrão da indústria: adicionar `tokenVersion: number` ao user e incluir no JWT payload. Incrementa em qualquer troca de senha. O `auth.hook` valida que o `tokenVersion` do JWT bate com o atual do user.
  - Decisão pragmática pro TCC: **fica como follow-up**. Pra um app de eventos locais, o risco é aceitável.
- **Rate limit de tentativas no `change-password`**: defesa contra brute-force da senha atual via JWT válido. Pode ser implementado futuramente. Não bloqueante.
- **Reauth via biometria (Face/Touch ID)**: feature interessante de UX (o usuário não digita a senha atual, só usa biometria). Fora do escopo dessa fase. Quando for adicionar, exige `expo-local-authentication` no app + decisão de qual operações requerem reauth.

---

*Documento v1 — criado pelo agente do frontend após implementação. Qualquer mudança requer comunicação entre os dois lados.*
