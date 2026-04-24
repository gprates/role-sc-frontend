# Guia de Publicação — Rolê SC

Passo a passo para gerar builds e publicar o app via **EAS (Expo Application Services)**.

O fluxo é dividido em duas fases:

1. **APK de preview** — para testar no próprio celular / mandar pro orientador / distribuir por link. **Grátis.**
2. **Publicação na Play Store** — build AAB + submissão via EAS Submit. **US$ 25 uma vez** (Google Play Console).

---

## Pré-requisitos (só na primeira vez)

### 1. Criar conta Expo (grátis)

Abre https://expo.dev/signup e cria uma conta. Não precisa de cartão.

### 2. Instalar o EAS CLI globalmente

```powershell
pnpm add -g eas-cli
```

> Se o pnpm reclamar de permissão global no Windows, roda com npm em vez disso: `npm install -g eas-cli`.

### 3. Fazer login no CLI

```powershell
eas login
```

Vai abrir o browser pra você confirmar.

### 4. Vincular o projeto à sua conta Expo

Na raiz do `role-sc-frontend`:

```powershell
eas init
```

Isso adiciona um `projectId` em `app.json` (na seção `extra.eas.projectId`). **Commita** essa mudança no git — é público, não é secret.

### 5. Configurar os secrets de build

As variáveis `EXPO_PUBLIC_*` são lidas do `.env` em **desenvolvimento**, mas durante um build na nuvem o `.env` **não é enviado** (está no `.gitignore`). Precisamos cadastrar os valores como secrets no EAS, que são injetados no momento do build.

```powershell
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://805tspcek8.execute-api.sa-east-1.amazonaws.com/prod"
eas secret:create --scope project --name EXPO_PUBLIC_API_KEY --value "tGQVLLGQFh2Z41AjyIlCn9Crr7boblsJ3rcg3dm1"
```

> ⚠️ **Importante sobre a "API key":** como essas variáveis têm prefixo `EXPO_PUBLIC_`, o valor **é embutido no JavaScript do APK**. Qualquer pessoa com o APK pode extrair a chave via decompilação. Ou seja, ela serve pra throttling/tracking no API Gateway, **não** como mecanismo de segurança real. Pra autenticação real usamos o JWT do usuário, que é gerado e validado server-side.

Para listar os secrets cadastrados:
```powershell
eas secret:list
```

---

## Fase 1 — Gerar APK de preview (grátis, pronto pra testar)

### Quando usar

- Testar o app fora do Expo Go
- Mandar pro orientador, colegas de TCC, banca
- Instalar em celular de demo
- Gravar vídeo de apresentação sem depender do Metro rodando

### Comando

```powershell
pnpm build:preview
```

Isso dispara um build na nuvem da Expo. O terminal vai mostrar um link tipo:

```
Build details: https://expo.dev/accounts/<voce>/projects/role-sc/builds/abc123
```

Você pode acompanhar o progresso nesse link. O build leva **10-20 minutos** (depende da fila da Expo no momento).

Quando terminar, o mesmo link vai mostrar um botão **"Install"** com QR code. Aponta a câmera do Android pro QR → baixa o APK direto no celular → instala.

> Na primeira instalação, o Android vai pedir permissão pra instalar de "fontes desconhecidas". Aceita.

### Compartilhar com terceiros

Na página do build no `expo.dev`, tem o link direto do APK. Qualquer pessoa com o link pode baixar e instalar, sem precisar de conta Expo.

### Limites do tier grátis

| Recurso | Tier grátis |
|---------|-------------|
| Builds por mês | **30** (dá tranquilo pro TCC) |
| Concorrência | 1 build por vez (outros ficam na fila) |
| Tempo por build | Até 60 minutos |
| Retenção do APK | 30 dias (depois expira, mas é só fazer novo build) |

---

## Fase 2 — Publicar na Play Store

### Pré-requisitos (só na primeira vez)

1. **Conta Google Play Console**: https://play.google.com/console/signup
   - **Taxa única de US$ 25**, cobrado 1x pra sempre
   - Após pagar, leva alguns minutos até liberar
2. Ícones reais do app (a gente ainda não tem — hoje o `app.json` usa os ícones default da Expo). Antes de publicar, precisa adicionar:
   - `./assets/icon.png` (1024x1024)
   - `./assets/adaptive-icon.png` (1024x1024)
   - `./assets/splash.png` (1284x2778 recomendado)
3. Preencher metadados no Play Console: descrição, screenshots, política de privacidade (obrigatório)

### Passo 1 — Gerar o AAB de produção

```powershell
pnpm build:production
```

Mesma coisa do preview, mas:
- Formato **AAB** (Android App Bundle, exigido pela Play Store)
- Incrementa automaticamente o `versionCode` a cada build (exigência do Google: cada upload precisa ter versionCode maior que o anterior)
- Usa o canal `production` (importante pra updates OTA depois)

### Passo 2 — Criar o app no Play Console

1. Entra em https://play.google.com/console
2. "Create app" → preenche nome "Rolê SC", idioma default português BR, tipo "App", gratuito
3. Na aba "App content", preencha todos os requisitos (privacidade, classificação, público-alvo, etc.). **Isso leva de 1-2h na primeira vez.** O Google é rigoroso com essa parte.

### Passo 3 — Submissão via EAS

Configurar credenciais uma vez:

```powershell
eas credentials
```

Segue o menu: Android → Production → "Google Service Account Key" (segue o wizard — ele tem link pra criar a service account no Google Cloud Console). Leva uns 15 min.

Depois, pra submeter:

```powershell
pnpm submit:production
```

O EAS pega o último build de produção e envia pra Play Console. O `eas.json` já está configurado com `track: "internal"`, que sobe pro teste interno (não pro público).

### Passo 4 — Dentro do Play Console, promover pra release

Depois que o EAS Submit terminar, seu AAB aparece no Play Console em **"Testing → Internal testing"**.

A partir daí, três caminhos:

#### Opção A: Manter em teste interno (recomendado pro TCC)

- Você convida testadores pelo email dentro do Play Console
- Eles entram via link do Play Store (aparece como app normal pra eles)
- **Não é necessário passar pelo review completo da Google**
- Ideal para defesa de TCC: a banca tem um app "publicado" na Play Store sem você ter passado por 2 semanas de review

#### Opção B: Testar com mais gente (closed testing)

- Grupo maior, mas já entra em fila de review do Google
- Útil se você quiser ~50+ pessoas testando antes do público

#### Opção C: Publicar pro público

- Production release
- **Exigências atuais da Google (2026):** 14 dias de teste fechado com pelo menos 12 testadores ativos antes de liberar a publicação
- Review pode levar 3-7 dias
- Fora do escopo do TCC, mas possível se quiser deixar o app disponível pra qualquer um

---

## Atualizações futuras (EAS Update)

Se você corrigir um bug em código JS/TS **sem mexer em dependências nativas**, dá pra atualizar o app já instalado sem precisar gerar APK novo nem passar por Play Store:

```powershell
eas update --channel production --message "Corrige cor do botão de login"
```

O app baixa a nova versão do JS na próxima abertura. Grátis no tier free (com limites generosos). Isso é possível porque os canais `preview` e `production` estão configurados no `eas.json`.

Se mudou dependências nativas (ex: adicionou uma lib com módulos nativos), precisa de build/submit novo.

---

## Roadmap pragmático pro TCC

1. **Agora**: continua com Expo Go (zero custo, hot reload)
2. **Quando o backend de verificação de email estiver pronto**: `pnpm build:preview` e instala o APK no próprio celular pra testar e-mail de verdade (porque no Expo Go pode haver limitações de scheme)
3. **Pra defesa**: gera APK preview atualizado e deixa o link pronto pra banca baixar. **Custo: R$ 0.**
4. **Opcional, entrega final**: pagar os US$ 25 do Play Console e publicar em teste interno. Gera screenshot "meu app na Play Store" pro relatório do TCC.

---

## Troubleshooting

### "Build failed: Cannot find module 'X'"
Rodar `pnpm fix-deps` (atualiza versões de libs Expo para combinar com o SDK) e tentar de novo.

### "Credential error" no build
Rodar `eas credentials` e deixar o EAS gerar as credenciais Android automaticamente (primeira opção do menu).

### "App crashes on open" no APK instalado
Provavelmente as envs não foram injetadas. Confere se rodou `eas secret:list` e vê as duas variáveis (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_KEY`). Se estiverem lá mas ainda crashar, tira um log com `adb logcat` (precisa de Android Studio instalado) pra ver o erro real.

### Build levou mais de 60 minutos
Provavelmente travou. Cancela pelo painel do expo.dev e tenta de novo. Se acontecer várias vezes, abre issue no repo do Expo ou pergunta na comunidade.
