import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { STORAGE_KEYS } from '@/utils/constants';
import { storage } from '@/utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

if (!API_BASE_URL) {
  console.warn(
    '[api] EXPO_PUBLIC_API_BASE_URL não definido. Requisições HTTP vão falhar. Configure o arquivo .env.',
  );
}

if (!API_KEY) {
  console.warn(
    '[api] EXPO_PUBLIC_API_KEY não definido. O API Gateway vai rejeitar as requisições. Configure o arquivo .env.',
  );
}

/**
 * Callback opcional invocado quando o backend retorna 401.
 * Injetado pelo AuthContext para forçar logout e redirecionar ao Login.
 * Evita acoplar a camada de API diretamente ao contexto.
 */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (API_KEY) config.headers.set('x-api-key', API_KEY);

    const token = await storage.get<string>(STORAGE_KEYS.token);
    if (token) config.headers.set('Authorization', `Bearer ${token}`);

    if (__DEV__) {
      const method = (config.method ?? 'GET').toUpperCase();
      const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
      const hasToken = Boolean(token);
      // eslint-disable-next-line no-console
      console.log(
        `[api] → ${method} ${url}${config.params ? ` params=${JSON.stringify(config.params)}` : ''}${hasToken ? ' (auth)' : ''}`,
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (res) => {
    if (__DEV__) {
      const method = (res.config.method ?? 'GET').toUpperCase();
      const url = `${res.config.baseURL ?? ''}${res.config.url ?? ''}`;
      // eslint-disable-next-line no-console
      console.log(`[api] ← ${res.status} ${method} ${url}`);
    }
    return res;
  },
  (error: AxiosError<{ success: false; message: string }>) => {
    if (__DEV__) {
      const method = (error.config?.method ?? 'GET').toUpperCase();
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      const status = error.response?.status ?? 'no-response';
      const body = error.response?.data;
      // eslint-disable-next-line no-console
      console.log(
        `[api] ✕ ${status} ${method} ${url}${body ? ` body=${JSON.stringify(body)}` : ` err=${error.message}`}`,
      );
    }

    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/**
 * Extrai uma mensagem de erro amigável de qualquer erro vindo da API.
 * Usado nas telas para exibir Alert/toast quando algo falha.
 */
export const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (err.code === 'ECONNABORTED') return 'A requisição demorou demais. Tente novamente.';
    if (err.message === 'Network Error') {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Ocorreu um erro inesperado.';
};

export default api;
