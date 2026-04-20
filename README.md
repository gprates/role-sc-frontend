# Rolê SC — App Mobile

Aplicativo mobile em **React Native + Expo** que exibe eventos culturais e municipais do litoral de Santa Catarina (Itajaí, Camboriú, Porto Belo, Itapema, Bombinhas), consumindo a API REST do TCC Rolê SC.

> Parte do ecossistema TCC: **web-crawler** → **nlp-processor** → **api** → **app** (este projeto).

---

## Stack

| Tecnologia | Uso |
|------------|-----|
| React Native + Expo SDK 54 | Framework mobile (Android only nesta fase) |
| TypeScript 5.9 | Tipagem |
| React Navigation 7 | Navegação (stack + bottom tabs) |
| Axios | Cliente HTTP |
| AsyncStorage | Persistência do JWT e dos favoritos |
| Context API | Estado global de autenticação |
| expo-linear-gradient, @expo/vector-icons | UI |
| expo-web-browser | Abrir a publicação original em navegador in-app |
| React Native `Share` | Compartilhamento nativo Android |
| pnpm | Package manager (consistência com backend) |

---

## Pré-requisitos

- **Node.js 20.19+** (Expo SDK 54 exige — seu Node atual é 16, será necessário atualizar)
- **pnpm 8+**
- **Emulador Android** (Android Studio) ou um celular Android com o app **Expo Go** instalado

---

## Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e preencha EXPO_PUBLIC_API_BASE_URL e EXPO_PUBLIC_API_KEY

# 3. (Opcional) Corrigir versões das dependências Expo (recomendado na primeira vez)
pnpm fix-deps

# 4. Rodar
pnpm start            # abre o Metro + QR code para Expo Go
pnpm android          # abre direto no emulador Android
```

### Variáveis de ambiente (`.env`)

```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
EXPO_PUBLIC_API_KEY=<sua-api-key>
```

- `10.0.2.2` é o alias do host no emulador Android (equivalente a `localhost` do seu PC quando roda o `invoke-local` do backend).
- Em um celular físico, troque por `http://<IP-do-PC>:3000` ou pela URL do API Gateway.
- `EXPO_PUBLIC_API_KEY` é obrigatório — o API Gateway rejeita requests sem o header `x-api-key`.

> Qualquer variável prefixada com `EXPO_PUBLIC_` é automaticamente disponibilizada em `process.env` no app em runtime (recurso nativo do Expo SDK 49+).

---

## Arquitetura

```
src/
├── App.tsx                         # entry point do app
├── navigation/
│   ├── RootNavigator.tsx           # escolhe Auth ou App (baseado no token)
│   ├── AuthNavigator.tsx           # stack: Login, Cadastro, RecuperarSenha
│   ├── AppNavigator.tsx            # bottom tabs: Eventos, Favoritos, Perfil
│   └── types.ts                    # tipos do React Navigation
├── screens/
│   ├── auth/                       # LoginScreen, CadastroScreen, RecuperarSenhaScreen
│   ├── eventos/                    # HomeScreen, DetalheEventoScreen, ComentariosModal
│   ├── favoritos/                  # FavoritosScreen
│   └── perfil/                     # PerfilScreen, EditarPerfilScreen, AlterarSenhaScreen
├── components/
│   ├── Button.tsx, Input.tsx
│   ├── EventoCard.tsx, EventoCoverPlaceholder.tsx
│   ├── CategoriaBadge.tsx, FilterChip.tsx
│   ├── EmptyState.tsx, Logo.tsx, ScreenBackground.tsx
├── services/
│   ├── api.ts                      # axios com interceptors (x-api-key + JWT)
│   ├── auth.service.ts             # register, login, getMe, forgotPassword (stub)
│   ├── evento.service.ts           # list, getById
│   ├── metadata.service.ts         # getMunicipios, getCategorias
│   └── favoritos.service.ts        # favoritos locais via AsyncStorage
├── contexts/
│   └── AuthContext.tsx             # user, token, signIn, signUp, signOut
├── hooks/
│   ├── useEventos.ts               # lista com filtros + paginação / infinite scroll
│   └── useFavoritos.ts             # favoritos locais reativos
├── types/                          # Evento, User, Auth + respostas da API
├── theme/                          # colors, typography, spacing
└── utils/                          # storage (AsyncStorage tipado), format (datas), constants
```

### Padrões aplicados

- **Service Layer** — toda chamada HTTP encapsulada em um `*.service.ts`, espelhando o backend
- **Repository local** — `favoritos.service.ts` oferece a mesma interface que um endpoint server-side ofereceria, permitindo trocar a implementação sem tocar nas telas
- **Interceptors axios** — injetam `x-api-key` (env) e `Authorization: Bearer <token>` (AsyncStorage) automaticamente
- **401 handler** — o interceptor dispara um logout automático via callback injetado pelo `AuthContext`
- **Single-select filters** — os filtros de município e categoria são single-select para bater com o contrato atual do backend (`/eventos?municipio=...&categoria=...`)

---

## Funcionalidades

### Implementadas (com backend real)
- Cadastro e login com JWT
- Listagem de eventos com filtro por município, categoria e busca textual
- Paginação via scroll infinito + pull-to-refresh
- Detalhe do evento com todas as informações
- Abrir publicação original no navegador (`expo-web-browser`)
- Compartilhar evento (Share nativo do Android)

### Implementadas (local, sem backend)
- **Favoritos** — persistidos em AsyncStorage
- **Configurações de notificação** — toggles persistidos em AsyncStorage (push não é efetivamente enviada ainda)

### UI pronta, mas desabilitada (backend ainda não expõe)
- Curtir, comentar, "eu vou!" — botões mostram "Em breve"
- Editar perfil / alterar senha — formulários prontos, botão desabilitado
- Recuperar senha — service stub que simula sucesso (quando o endpoint for criado, basta trocar o corpo da função `authService.forgotPassword`)

---

## Sincronização com o backend

Os arrays abaixo **devem ficar em sincronia** com o backend (`src/utils/constants.ts`):

- `MUNICIPIOS_FIXOS`: os 5 municípios-alvo do TCC. A API pode retornar um subconjunto (apenas os que já têm eventos crawleados) via `GET /municipios`, mas os chips da home mostram sempre os 5 para UX consistente.
- `CATEGORIAS`: deve bater com `CATEGORIAS_VALIDAS` do NLP Processor e da API (`GET /categorias`).

Se o backend mudar alguma dessas listas, basta atualizar o arquivo de constantes — nenhuma tela precisa ser mexida.

---

## Licença / Créditos

Projeto acadêmico (TCC) de Gabriel Prates — 2026.
