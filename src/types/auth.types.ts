export interface UserPublic {
  _id: string;
  nome: string;
  email: string;
  emailVerified?: boolean;
  /**
   * URL pública do avatar no S3, com query string `?v=` pra cache busting.
   * `undefined` significa que o usuário ainda não fez upload de nenhuma foto.
   */
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginBody {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: true;
  token: string;
  user: UserPublic;
}

export interface RegisterBody {
  nome: string;
  email: string;
  senha: string;
}

export interface RegisterResponse {
  success: true;
  message: string;
}

export interface MeResponse {
  success: true;
  user: UserPublic;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  /**
   * Código opcional para tratamento específico pelo frontend.
   * Ver seção "Princípios" do CONTRATO_VERIFICACAO_EMAIL.md.
   */
  code?: string;
}

/**
 * Códigos de erro que o backend pode retornar.
 * Mantidos em sincronia com o contrato da API.
 */
export const API_ERROR_CODES = {
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_RESET_CODE: 'INVALID_RESET_CODE',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  AVATAR_TOO_LARGE: 'AVATAR_TOO_LARGE',
  AVATAR_INVALID_TYPE: 'AVATAR_INVALID_TYPE',
  AVATAR_NOT_UPLOADED: 'AVATAR_NOT_UPLOADED',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ResendVerificationBody {
  email: string;
}

export interface ResendVerificationResponse {
  success: true;
  message: string;
}

// --- Recuperação de senha ---
// Ver CONTRATO_RECUPERACAO_SENHA.md para detalhes do fluxo.

export interface ForgotPasswordBody {
  email: string;
}

export interface ForgotPasswordResponse {
  success: true;
  message: string;
}

export interface VerifyResetCodeBody {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  success: true;
  /** Token de uso único usado em /auth/reset-password. Validade: 15 min. */
  resetToken: string;
}

export interface ResetPasswordBody {
  email: string;
  resetToken: string;
  novaSenha: string;
}

export interface ResetPasswordResponse {
  success: true;
  message: string;
}

// --- Alteração de senha (logado) ---
// Ver CONTRATO_ALTERAR_SENHA.md para detalhes do fluxo.

export interface ChangePasswordBody {
  senhaAtual: string;
  novaSenha: string;
}

export interface ChangePasswordResponse {
  success: true;
  message: string;
}

// --- Edição do perfil (logado) ---
// Ver CONTRATO_EDITAR_PERFIL.md para detalhes do fluxo.

export interface UpdateProfileBody {
  nome: string;
}

export interface UpdateProfileResponse {
  success: true;
  user: UserPublic;
}

// --- Login com Google ---
// Ver CONTRATO_LOGIN_GOOGLE.md para detalhes do fluxo.

export interface GoogleLoginBody {
  /** id_token (JWT) emitido pelo Google após OAuth bem-sucedido no app. */
  idToken: string;
}

export interface GoogleLoginResponse {
  success: true;
  token: string;
  user: UserPublic;
  /**
   * Indica se essa requisição CRIOU uma nova conta (true) ou se foi
   * login de um usuário existente (false). Pode ser útil pro app
   * decidir se mostra um toast tipo "Bem-vindo!" ou "Bem-vindo de volta".
   */
  isNewUser: boolean;
}
