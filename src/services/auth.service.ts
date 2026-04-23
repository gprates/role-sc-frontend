import axios from 'axios';

import api from './api';
import {
  ApiErrorBody,
  ApiErrorCode,
  LoginBody,
  LoginResponse,
  MeResponse,
  RegisterBody,
  RegisterResponse,
  ResendVerificationResponse,
} from '@/types';

export const authService = {
  async login(body: LoginBody): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', body);
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
   * Stub — endpoint ainda não existe no backend.
   * Simula um delay e sempre retorna sucesso (comportamento acordado com o usuário).
   * Quando o backend implementar POST /auth/forgot-password, basta descomentar
   * a chamada real e remover o setTimeout.
   */
  async forgotPassword(_email: string): Promise<{ success: true }> {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    return { success: true };
    // const { data } = await api.post('/auth/forgot-password', { email: _email });
    // return data;
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
