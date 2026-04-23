import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setUnauthorizedHandler } from '@/services/api';
import { authService } from '@/services/auth.service';
import { UserPublic } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { storage } from '@/utils/storage';

interface AuthContextValue {
  user: UserPublic | null;
  token: string | null;
  bootstrapping: boolean;
  submitting: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  /**
   * Cria uma conta no backend.
   *
   * IMPORTANTE: após sucesso, o usuário NÃO é logado automaticamente.
   * O backend exige verificação de email antes de permitir login
   * (ver CONTRATO_VERIFICACAO_EMAIL.md, seção 4.1). A tela chamadora
   * deve navegar para VerificarEmail e orientar o usuário a checar a caixa.
   */
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const signOut = useCallback(async () => {
    await storage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    const restore = async () => {
      const [storedToken, storedUser] = await Promise.all([
        storage.get<string>(STORAGE_KEYS.token),
        storage.get<UserPublic>(STORAGE_KEYS.user),
      ]);
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(storedUser);
      setBootstrapping(false);
    };
    void restore();
  }, []);

  const signIn = useCallback(async (email: string, senha: string) => {
    setSubmitting(true);
    try {
      const res = await authService.login({ email, senha });
      await storage.set(STORAGE_KEYS.token, res.token);
      await storage.set(STORAGE_KEYS.user, res.user);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const signUp = useCallback(
    async (nome: string, email: string, senha: string) => {
      setSubmitting(true);
      try {
        await authService.register({ nome, email, senha });
        // NÃO autenticamos aqui. O backend requer verificação de email
        // antes de liberar o login. Quem chamou signUp é responsável por
        // navegar até a tela VerificarEmail.
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      await storage.set(STORAGE_KEYS.user, res.user);
      setUser(res.user);
    } catch (err) {
      console.warn('[AuthContext.refreshUser] falhou', err);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      bootstrapping,
      submitting,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, token, bootstrapping, submitting, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
};
