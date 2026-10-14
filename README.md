# Rolê SC — App Android

Aplicativo Android em **React Native + Expo** que reúne eventos culturais e municipais de seis municípios do litoral norte de Santa Catarina (Itajaí, Camboriú, Balneário Camboriú, Porto Belo, Itapema e Bombinhas). Os dados vêm da API REST do projeto (`role-sc-api`).

> Parte do ecossistema do TCC Rolê SC: **webcrawler** → **processador NLP** → **API** → **app** (este repositório) e site.

O que o app faz:

- lista eventos com busca textual, filtros de município e categoria (multisseleção), período e status (ativos ou passados), rolagem infinita e pull-to-refresh;
- mostra o detalhe do evento, abre a publicação original no navegador do app e compartilha o evento;
- favoritos por usuário, guardados na API;
- comentários públicos com curtidas;
- cadastro e login por e-mail e senha, verificação de e-mail, recuperação e troca de senha;
- perfil com nome e foto (upload para o S3 por URL pré-assinada que a API devolve);
- login com Google (SDK nativo `@react-native-google-signin/google-signin`).

Só Android nesta fase. O app não acessa banco nem AWS diretamente: tudo passa pela API.

---

## Stack

| Tecnologia | Uso |
|---|---|
| Expo SDK 54, React Native 0.81, React 19 | Framework mobile (nova arquitetura ligada) |
| TypeScript 5.9 | Tipagem |
| React Navigation 7 | Navegação (stack + abas) |
| Axios | Cliente HTTP (headers `x-api-key` e `Authorization: Bearer`) |
| AsyncStorage | Token JWT e usuário da sessão |
| `@react-native-google-signin/google-signin` | Login com Google (módulo nativo) |
| expo-image-picker, expo-file-system | Foto de perfil |
| expo-updates | Atualizações OTA (EAS Update) |
| pnpm | Gerenciador de pacotes |
| EAS Build / Submit / Update | Build na nuvem e publicação na Play Store |

---

## Antes de começar: o app não roda no Expo Go

O app importa o módulo nativo do Google Sign-In na tela de login, que é carregada na abertura. O Expo Go não traz esse módulo, então **o app inteiro quebra ao abrir no Expo Go** (erro `TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found`), não só o botão do Google.

Para rodar é preciso um **development build**: um APK de debug do próprio app, compilado na sua máquina com `npx expo run:android`. Ele inclui todos os módulos nativos e continua carregando o JavaScript do Metro, com Fast Refresh.

- O projeto não tem `expo-dev-client` nem perfil `development` no `eas.json`, então não existe dev build pelo EAS. O caminho é compilar localmente.
- `pnpm start` (= `expo start`) só sobe o Metro. Não leia o QR code nem aperte `a`: isso abre o Expo Go.
- `pnpm android` (= `expo start --android`) também tenta abrir no Expo Go e **não serve** para este app.

---

## Pré-requisitos

| Item | Versão | Observação |
|---|---|---|
| Node.js | 20.19 ou mais novo | Testado com 24.21 |
| pnpm | 9 ou mais novo | O `pnpm-lock.yaml` é do formato v9; testado com 12.5.1 |
| Android Studio | atual | Instala o Android SDK, o `adb` e o emulador |
| Android SDK | Platform 36, Build-Tools 36.0.0, Platform-Tools | O NDK 27.1.12297006 é baixado pelo Gradle se faltar |
| JDK | 17 | Versão recomendada pelo React Native. JDKs muito novos (por exemplo 25+) não são suportados pelo Gradle 8.14 do projeto |
| Emulador ou aparelho | Android 7.0+ (API 24) | Para testar o login com Google, use uma imagem de emulador **com Google Play** |
| API Rolê SC | — | Local (`role-sc-api`, porta 3000) ou de produção |

No Windows, depois de instalar o Android Studio, configure as variáveis de ambiente do usuário:

```powershell
# PowerShell (abra um terminal novo depois)
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx JAVA_HOME "C:\caminho\para\o\jdk-17"
# e adicione %LOCALAPPDATA%\Android\Sdk\platform-tools ao PATH
```

Confira com `adb --version` e `java -version`.

No Windows, se o build nativo falhar com erro de caminho longo (`Filename too long` ou erros do CMake com caminhos de mais de 250 caracteres), ative os caminhos longos do Windows (`LongPathsEnabled`) e mantenha o projeto numa pasta de caminho curto (por exemplo `C:\dev\role-sc-frontend`).

---

## Instalação e checagens (não precisam de Android SDK)

```bash
pnpm install --frozen-lockfile
cp .env.example .env          # depois ajuste os valores (ver "Variáveis de ambiente")

pnpm type-check               # tsc --noEmit
npx expo-doctor               # saúde do projeto Expo
npx expo export --platform android --output-dir <pasta-temporária>   # gera o bundle JS (Hermes) sem precisar de SDK
```

Estado conhecido: `pnpm type-check` acusa 1 erro em `src/services/avatar.service.ts:101` (opção `size` que o tipo do `expo-file-system` não declara) e `expo-doctor` passa em 16 de 18 checagens (falta a peer dependency `expo-font` e há 4 pacotes Expo com patch abaixo do esperado). Nenhum dos dois impede o Metro de gerar o bundle.

---

## Rodar no emulador Android com a API local

> Os passos com emulador e aparelho seguem a configuração que o Expo gera para este projeto (conferida com `npx expo prebuild`), mas ainda não foram executados de ponta a ponta num emulador: a máquina usada na revisão desta documentação não tinha Android SDK. Instalação, Metro e bundle Android foram verificados.

1. **Suba a API** na porta 3000 do seu PC (pelo Docker Compose ou com `pnpm dev`, conforme o README do `role-sc-api`). Teste no PC: `curl http://localhost:3000/eventos` deve devolver JSON.
2. **Abra um emulador** pelo Device Manager do Android Studio e confira que ele aparece em `adb devices`.
3. **Aponte o app para a API** no `.env`:

   ```env
   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
   ```

   No emulador oficial do Android, `10.0.2.2` é o endereço do PC (o `localhost` do emulador é o próprio emulador). No Genymotion o endereço é `10.0.3.2`.
4. **Compile, instale e abra:**

   ```bash
   npx expo run:android
   ```

   Na primeira vez o comando gera a pasta `android/` (ignorada pelo git), baixa as dependências do Gradle (alguns minutos), instala o APK de debug, sobe o Metro na porta 8081 e abre o app.

No dia a dia:

- Mudou código TS/TSX: o Fast Refresh aplica sozinho.
- Mudou o `.env`: reinicie o Metro (`npx expo start --clear`) e recarregue o app (tecla `r` no terminal do Metro ou `R` duas vezes no emulador). Não precisa recompilar: as `EXPO_PUBLIC_*` só existem no JavaScript.
- Mudou dependência nativa, plugin ou `app.json`: rode `npx expo run:android` de novo.
- Com o APK de debug já instalado, também dá para só subir o Metro (`npx expo start`) e abrir o ícone do Rolê SC no emulador; o build de debug procura o Metro em `10.0.2.2:8081`.

---

## Rodar em um aparelho físico com a API local

1. No celular, ative as **Opções do desenvolvedor** e a **Depuração USB**. Conecte o cabo e aceite a autorização; `adb devices` deve listar o aparelho como `device`.
2. Compile e instale escolhendo o aparelho:

   ```bash
   npx expo run:android --device
   ```

   O Expo CLI faz `adb reverse` da porta do Metro (8081), então o app carrega o JavaScript pelo cabo.
3. Escolha como o celular chega na API:

   **Opção A — pelo cabo (recomendada).** Encaminhe a porta da API e use `localhost`:

   ```bash
   adb reverse tcp:3000 tcp:3000
   ```

   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

   O encaminhamento se perde quando o cabo é desconectado ou o `adb` reinicia; rode o comando de novo. Funciona igual com a depuração por Wi-Fi do Android 11+ (`adb pair` / `adb connect`).

   **Opção B — pela rede Wi-Fi.** PC e celular na mesma rede:

   ```env
   EXPO_PUBLIC_API_BASE_URL=http://<IP-do-PC-na-rede>:3000
   ```

   - Descubra o IP com `ipconfig` (campo "Endereço IPv4" do adaptador Wi-Fi).
   - No Windows, deixe a rede como **Privada** e libere a porta 3000 no firewall (PowerShell como administrador):

     ```powershell
     New-NetFirewallRule -DisplayName "Role SC API (dev)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
     ```

   - Teste abrindo `http://<IP-do-PC-na-rede>:3000/eventos` no navegador do celular. Se não abrir, a rede pode isolar os aparelhos (redes de universidade e de convidados costumam fazer isso) ou a API pode estar publicada só em `127.0.0.1`; nesses casos use a Opção A.

4. Depois de mudar o `.env`, reinicie o Metro com `npx expo start --clear` e recarregue o app (agite o aparelho para abrir o menu de desenvolvimento e toque em **Reload**). Se você subir o Metro sem o `run:android`, rode também `adb reverse tcp:8081 tcp:8081`.

### HTTP sem TLS (cleartext)

O Android 9+ bloqueia `http://` por padrão. No **build de debug** (o do `npx expo run:android`) o Expo gera `android/app/src/debug/AndroidManifest.xml` com `android:usesCleartextTraffic="true"`, então a API local em `http://` funciona. Builds **release** (o APK `preview` e o AAB `production` do EAS, ou `npx expo run:android --variant release`) não têm essa liberação: apontados para `http://`, eles falham com "Não foi possível conectar ao servidor". Para testar um build release contra a API local, exponha a API por **HTTPS** (por exemplo, um túnel). Não altere a configuração de produção só para isso.

### Login com Google em desenvolvimento

- Com `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` vazio, o botão "Entrar com Google" avisa que não está configurado; o resto do app funciona com e-mail e senha.
- Para funcionar no build de debug é preciso: o Client ID **Web** do Google Cloud em `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` e o mesmo valor em `GOOGLE_WEB_CLIENT_ID` na API; um OAuth Client **Android** com o pacote `com.rolesc.app` e o SHA-1 da keystore de debug (gerada em `android/app/debug.keystore`; veja o SHA-1 com `cd android && ./gradlew signingReport`); e um emulador com Google Play e conta Google (ou um aparelho real). Sem o SHA-1 certo o Google responde `DEVELOPER_ERROR`.

### Cadastro e e-mails na API local

O login por e-mail exige usuário com e-mail verificado (a API responde 403 `EMAIL_NOT_VERIFIED`, e o app leva à tela de verificação). Cadastro, reenvio de verificação e recuperação de senha dependem do envio de e-mail configurado na API; veja o README do `role-sc-api` para saber como ele funciona localmente. O upload de foto de perfil depende do S3 configurado na API.

---

## Docker

**O app não roda em Docker.** É um app nativo Android: precisa de um emulador ou de um aparelho, e o development build é compilado com o Android SDK na sua máquina. Por isso este repositório não tem Dockerfile.

O que roda em Docker é o backend. Para usar o app com a API do Docker Compose:

1. Suba a API pelo compose (instruções no README do `role-sc-api`). Ela fica na porta **3000 do PC**.
2. Configure `EXPO_PUBLIC_API_BASE_URL` conforme onde o app roda:

| Onde o app roda | `EXPO_PUBLIC_API_BASE_URL` | O que mais precisa |
|---|---|---|
| Emulador do Android Studio | `http://10.0.2.2:3000` | nada |
| Aparelho via USB | `http://localhost:3000` | `adb reverse tcp:3000 tcp:3000` |
| Aparelho via Wi-Fi | `http://<IP-do-PC-na-rede>:3000` | mesma rede, firewall liberado e porta publicada em todas as interfaces (não só `127.0.0.1`) |

3. Rode `npx expo run:android` como descrito acima. A API local não exige `x-api-key` (só o API Gateway de produção exige), então `EXPO_PUBLIC_API_KEY` pode ficar vazia.

---

## Variáveis de ambiente

Copie `.env.example` para `.env`. O `.env` está no `.gitignore`. Toda variável `EXPO_PUBLIC_*` é **embutida no JavaScript** do app (qualquer pessoa com o APK consegue ler), então nenhuma delas pode ser um segredo de verdade.

| Variável | Obrigatória | Lida em | Desenvolvimento local | Produção |
|---|---|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | sim | `src/services/api.ts` | `http://10.0.2.2:3000`, `http://localhost:3000` ou `http://<IP>:3000` (ver acima) | URL do stage do API Gateway (saída da stack da API), cadastrada no EAS |
| `EXPO_PUBLIC_API_KEY` | só em produção | `src/services/api.ts` (header `x-api-key`) | vazia (a API local ignora); vazia, o app só registra um aviso no log | API Key do Usage Plan do API Gateway, cadastrada no EAS |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | não (sem ela o login Google fica desativado) | `src/hooks/useGoogleSignIn.ts` | vazia, ou o Client ID Web de teste | Client ID Web do Google Cloud; mesmo valor de `GOOGLE_WEB_CLIENT_ID` na API |
| `EXPO_PUBLIC_CLARITY_PROJECT_ID` | não (sem ela o Clarity fica desligado) | `src/utils/clarity.ts` | vazia, ou o Project ID de um projeto de teste | Project ID do Microsoft Clarity, cadastrado no EAS (ver abaixo) |

Não há Client ID Android no app: o Google identifica o app pelo pacote `com.rolesc.app` e pelo SHA-1 da keystore cadastrados no OAuth Client Android. (A antiga `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` foi removida do `.env.example` porque o código nunca a leu.)

### Microsoft Clarity (heatmaps e gravação de sessão)

O app usa o SDK `@microsoft/react-native-clarity`, inicializado uma vez em `index.ts` (código em `src/utils/clarity.ts`).

- **Onde fica o ID:** o Project ID (página Settings do painel do Clarity) vai em `EXPO_PUBLIC_CLARITY_PROJECT_ID`. Em desenvolvimento, no `.env`. Nos builds do EAS, cadastre a variável no projeto Expo (expo.dev ou `eas env:create`) nos ambientes usados pelos perfis `preview` e `production`, como as outras `EXPO_PUBLIC_*`. Não coloque o ID no `eas.json` nem em arquivo versionado.
- **Sem ID, o Clarity fica desligado:** o SDK não é inicializado e o app funciona normalmente.
- **Só grava em Android 10+ (API 29).** O `minSdk` do app continua 24: em Android 7 a 9 o app instala e roda, mas não envia dados ao Clarity.
- **Exige build nativa nova.** O SDK tem código nativo, então só passa a funcionar num APK/AAB gerado depois da instalação do pacote; um update OTA não leva o módulo nativo. Se um update com esse código chegar a um binário antigo, o app não quebra, só não grava. Por isso, publique a integração junto com uma `version` nova (ver "Deploy").
- **Dados pessoais:** campos de texto (`TextInput`) são mascarados pelo SDK em qualquer modo. Nome, email, fotos de perfil e o código de verificação exibidos em tela recebem `testID="clarityMask"`; para que sejam mascarados, cadastre a regra `#clarityMask` como **Mask** em Settings > Masking no painel do Clarity.

---

## Scripts

| Script | Comando | Observação |
|---|---|---|
| `pnpm start` | `expo start` | Sobe o Metro. Use com um APK de debug já instalado; não abra no Expo Go |
| `pnpm android` | `expo start --android` | Abre no Expo Go: **não funciona** com este app. Use `npx expo run:android` |
| `pnpm web` | `expo start --web` | Fora do escopo (o Google Sign-In nativo não existe na web) |
| `pnpm type-check` | `tsc --noEmit` | 1 erro conhecido (ver acima) |
| `pnpm fix-deps` | `expo install --fix` | Alinha versões das libs Expo ao SDK (altera `package.json` e lockfile) |
| `pnpm build:preview` | `eas build --platform android --profile preview` | APK de teste na nuvem |
| `pnpm build:production` | `eas build --platform android --profile production` | AAB para a Play Store |
| `pnpm submit:production` | `eas submit --platform android --profile production` | Envia o AAB para a Play Console |

---

## Deploy (processo atual)

A publicação é feita com **EAS (Expo Application Services)**, por comandos manuais na máquina do desenvolvedor. O guia completo, com o passo a passo da conta Expo e da Play Console, está em [`docs/PUBLICACAO.md`](./docs/PUBLICACAO.md). Resumo:

### Configuração (uma vez)

1. Conta Expo com acesso ao projeto (`owner` e `extra.eas.projectId` em `app.json`).
2. CLI do EAS instalada globalmente (`pnpm add -g eas-cli` ou `npm i -g eas-cli`; o `eas.json` pede versão 13 ou mais nova) e `eas login`.
3. Variáveis de build cadastradas no projeto Expo, porque o `.env` não é enviado para a nuvem: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` e, se for usar o Clarity, `EXPO_PUBLIC_CLARITY_PROJECT_ID`. O guia usa `eas secret:create --scope project --name <VARIÁVEL> --value "<valor>"`; nas versões recentes do `eas-cli` o equivalente é `eas env:create`. Confira com `eas secret:list` / `eas env:list`. Sem o Client ID Web, o build sai com o login Google desativado.
4. Google Cloud: OAuth Client Web (o valor acima) e OAuth Client Android com o pacote `com.rolesc.app` e o SHA-1 da keystore de produção (`eas credentials` mostra). Se a Play Store assinar o app (Play App Signing), cadastre também o SHA-1 de assinatura mostrado na Play Console.
5. Play Console: app criado, "Conteúdo do app" preenchido e Service Account Key configurada pelo `eas credentials` (Android → Production) para o `eas submit`.

A assinatura usa as credenciais Android gerenciadas pelo EAS (não há keystore no repositório).

### A cada versão

| Passo | Comando | O que faz |
|---|---|---|
| 1. Versão | editar `version` em `app.json` (e, por consistência, `package.json` e `APP_VERSION` em `src/utils/constants.ts`) | Com `runtimeVersion.policy = appVersion`, a versão também separa o canal de updates OTA |
| 2. Checar | `pnpm type-check` e `npx expo-doctor` | Manual, sem CI |
| 3. APK de teste | `pnpm build:preview` | Perfil `preview`: distribuição interna, canal `preview`, APK; link e QR code no expo.dev |
| 4. AAB de produção | `pnpm build:production` | Perfil `production`: loja, canal `production`, AAB, `autoIncrement` do `versionCode` (com `appVersionSource: local`, o número fica no arquivo local; commite a alteração) |
| 5. Enviar | `pnpm submit:production` | Envia o último build para a trilha **internal** da Play Console |
| 6. Promover | Play Console (web) | Teste interno → fechado → produção |

**Correção só de JavaScript (OTA):** `eas update --channel production --message "..."`. Só alcança instalações com a mesma `version`. Atenção: o update é empacotado na sua máquina, então as `EXPO_PUBLIC_*` vêm do ambiente local (ou de `--environment production` nas versões recentes do `eas-cli`). Publicar com o `.env` de desenvolvimento faria o app de produção apontar para `10.0.2.2`.

---

## Estrutura

```
index.ts                 # registra o App
app.json                 # configuração Expo (pacote, plugins, updates)
eas.json                 # perfis de build e submit do EAS
src/
├── App.tsx              # providers (gestos, teclado, safe area, auth, favoritos)
├── navigation/          # RootNavigator (Auth x App), AuthNavigator, AppNavigator (abas)
├── screens/
│   ├── auth/            # Login, Cadastro, VerificarEmail, RecuperarSenha, ConfirmarCodigo, RedefinirSenha
│   ├── eventos/         # Home (lista + filtros), DetalheEvento, ComentariosModal
│   ├── favoritos/       # Favoritos
│   └── perfil/          # Perfil, EditarPerfil, AlterarSenha
├── components/          # botões, inputs, cards, chips e modais de filtro, botão do Google
├── services/            # api.ts (axios + interceptors) e um *.service.ts por recurso da API
├── contexts/            # AuthContext (sessão) e FavoritosContext
├── hooks/               # useEventos, useComentarios, useAvatarUpload, useGoogleSignIn, useDebounce
├── types/               # tipos de Evento, User, Comentario, Avatar e respostas da API
├── theme/               # cores, tipografia, espaçamento
└── utils/               # storage, datas, períodos, senha, compartilhar, constantes
docs/                    # guia de publicação e contratos de integração com a API
```

Constantes que precisam acompanhar a API e o processador NLP (`src/utils/constants.ts` e afins): `MUNICIPIOS_FIXOS` (6 municípios), `CATEGORIAS` (9 categorias), regras de senha (`src/utils/password.ts`), limite de 1000 caracteres por comentário e limites do avatar (5 MB; JPEG, PNG, WebP ou GIF).

---

## Documentação relacionada

- [`docs/PUBLICACAO.md`](./docs/PUBLICACAO.md) — builds e publicação pelo EAS
- [`docs/CONTRATO_VERIFICACAO_EMAIL.md`](./docs/CONTRATO_VERIFICACAO_EMAIL.md) — verificação de e-mail
- [`docs/CONTRATO_RECUPERACAO_SENHA.md`](./docs/CONTRATO_RECUPERACAO_SENHA.md) — recuperação de senha por código
- [`docs/CONTRATO_ALTERAR_SENHA.md`](./docs/CONTRATO_ALTERAR_SENHA.md) — alteração de senha
- [`docs/CONTRATO_AVATAR.md`](./docs/CONTRATO_AVATAR.md) — upload de avatar (S3 + URL pré-assinada)
- [`docs/CONTRATO_EDITAR_PERFIL.md`](./docs/CONTRATO_EDITAR_PERFIL.md) — edição do nome
- [`docs/CONTRATO_LOGIN_GOOGLE.md`](./docs/CONTRATO_LOGIN_GOOGLE.md) — login com Google

---

## Licença / Créditos

Projeto acadêmico (TCC) de Gabriel Prates — 2026.
