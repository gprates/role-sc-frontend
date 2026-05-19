import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/services/api';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (!WEB_CLIENT_ID && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[GoogleSignIn] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não configurado. ' +
      'Login com Google vai falhar até preencher no .env / EAS secret.',
  );
}

// Configuração global da lib. Roda uma vez na carga do módulo.
// O Android NÃO precisa de androidClientId aqui — a identificação do Client
// Android acontece via SHA-1 do APK (já registrado no Google Cloud Console).
// O webClientId é OBRIGATÓRIO porque é o que permite emitir o id_token (o
// Android Client sozinho só emite access_token).
if (WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
  });
}

interface UseGoogleSignInReturn {
  /** Dispara o fluxo de login. Erros são tratados internamente via Alert. */
  signInWithGoogle: () => Promise<void>;
  /** True enquanto o modal nativo estiver aberto ou a request pro backend em curso. */
  loading: boolean;
  /** True se a configuração de OAuth não estiver pronta (sem CLIENT_ID). */
  notConfigured: boolean;
}

export const useGoogleSignIn = (): UseGoogleSignInReturn => {
  const { signInWithGoogle: applyGoogleAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  // Limpeza preventiva: se o app ficou com sessão Google "dangling" de uma
  // tentativa anterior, garantimos um estado limpo antes do próximo login.
  useEffect(() => {
    GoogleSignin.signOut().catch(() => {
      // Ignora silenciosamente — não tem sessão, não tem problema.
    });
  }, []);

  const notConfigured = !WEB_CLIENT_ID;

  const signInWithGoogle = useCallback(async () => {
    if (notConfigured) {
      Alert.alert(
        'Não configurado',
        'O login com Google não está disponível neste build.',
      );
      return;
    }

    setLoading(true);
    try {
      // Garantir que o Google Play Services está disponível e atualizado.
      // Sem isso, signIn() falha em devices antigos / com Play Services
      // desatualizado e a mensagem de erro é confusa.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // SIGN_IN_CANCELLED entra aqui também — usuário fechou a modal.
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert(
          'Não foi possível entrar',
          'Google não retornou as credenciais esperadas. Tente novamente.',
        );
        return;
      }

      await applyGoogleAuth(idToken);
    } catch (err) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // Usuário cancelou. Sem alert.
            return;
          case statusCodes.IN_PROGRESS:
            // Já tem outro signIn em curso. Só ignora.
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              'Google Play Services indisponível',
              'Atualize ou ative o Google Play Services pra continuar.',
            );
            return;
        }
      }
      Alert.alert('Não foi possível entrar', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyGoogleAuth, notConfigured]);

  return { signInWithGoogle, loading, notConfigured };
};
