export interface UserPublic {
  _id: string;
  nome: string;
  email: string;
  emailVerified?: boolean;
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
