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
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ResendVerificationBody {
  email: string;
}

export interface ResendVerificationResponse {
  success: true;
  message: string;
}
