import api from './api';
import {
  LoginBody,
  LoginResponse,
  MeResponse,
  RegisterBody,
  RegisterResponse,
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
