import axios from 'axios';

import api from './api';
import {
  ApiErrorBody,
  ApiErrorCode,
  ChangePasswordResponse,
  ForgotPasswordResponse,
  GoogleLoginResponse,
  LoginBody,
  LoginResponse,
  MeResponse,
  RegisterBody,
  RegisterResponse,
  ResendVerificationResponse,
  ResetPasswordResponse,
  UpdateProfileResponse,
  VerifyResetCodeResponse,
} from '@/types';

export const authService = {
  async login(body: LoginBody): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', body);
    return data;
  },

  /**
   * Troca um id_token do Google por um JWT nosso. Cria a conta se ainda
   * não existir; se já existir um user com o mesmo email, faz o linking
   * automático (ver CONTRATO_LOGIN_GOOGLE.md, seção 4.1).
   */
  async googleLogin(idToken: string): Promise<GoogleLoginResponse> {
    const { data } = await api.post<GoogleLoginResponse>('/auth/google', {
      idToken,
    });
    return data;
  },

  async register(body: RegisterBody): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', body);
    return data;
  },

  async getMe(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data;
  },

  /**
   * Reenvia o email de verificação. Ver seção 4.4 do CONTRATO_VERIFICACAO_EMAIL.md.
   * Resposta é sempre genérica — não indica se o email existe ou não (antienumeration).
   */
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    const { data } = await api.post<ResendVerificationResponse>(
      '/auth/resend-verification',
      { email },
    );
    return data;
  },

  /**
   * Inicia o fluxo de recuperação de senha enviando um código de 6 dígitos
   * para o email informado. Resposta sempre genérica (antienumeration).
   * Ver CONTRATO_RECUPERACAO_SENHA.md, seção 4.1.
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const { data } = await api.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { email },
    );
    return data;
  },

  /**
   * Valida o código de 6 dígitos enviado por email. Em caso de sucesso,
   * retorna um resetToken de uso único (validade 15 min) que é necessário
   * para de fato trocar a senha em /auth/reset-password.
   * Ver CONTRATO_RECUPERACAO_SENHA.md, seção 4.2.
   */
  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<VerifyResetCodeResponse> {
    const { data } = await api.post<VerifyResetCodeResponse>(
      '/auth/verify-reset-code',
      { email, code },
    );
    return data;
  },

  /**
   * Troca a senha do usuário, dado um resetToken válido obtido em
   * verifyResetCode. Ver CONTRATO_RECUPERACAO_SENHA.md, seção 4.3.
   */
  async resetPassword(
    email: string,
    resetToken: string,
    novaSenha: string,
  ): Promise<ResetPasswordResponse> {
    const { data } = await api.post<ResetPasswordResponse>(
      '/auth/reset-password',
      { email, resetToken, novaSenha },
    );
    return data;
  },

  /**
   * Altera a senha do usuário logado. Requer JWT (injetado pelo interceptor)
   * e a senha atual como prova de identidade.
   * Ver CONTRATO_ALTERAR_SENHA.md.
   */
  async changePassword(
    senhaAtual: string,
    novaSenha: string,
  ): Promise<ChangePasswordResponse> {
    const { data } = await api.post<ChangePasswordResponse>(
      '/auth/change-password',
      { senhaAtual, novaSenha },
    );
    return data;
  },

  /**
   * Atualiza o perfil do usuário logado. Por enquanto só permite trocar o nome
   * — email não pode ser alterado (decisão de produto, ver CONTRATO_EDITAR_PERFIL.md).
   */
  async updateProfile(nome: string): Promise<UpdateProfileResponse> {
    const { data } = await api.patch<UpdateProfileResponse>('/users/me', {
      nome,
    });
    return data;
  },
};

/**
 * Retorna o `code` semântico de um erro da API, se houver.
 * Usado pelas telas para branching (ex: detectar EMAIL_NOT_VERIFIED no login).
 */
export const getApiErrorCode = (err: unknown): ApiErrorCode | null => {
  if (!axios.isAxiosError<ApiErrorBody>(err)) return null;
  const code = err.response?.data?.code;
  return (code as ApiErrorCode) ?? null;
};
