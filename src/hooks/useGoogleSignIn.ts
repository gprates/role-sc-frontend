import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/services/api';

// Necessário pra finalizar o fluxo OAuth quando o user é redirecionado de
// volta pro app a partir do browser do sistema. Deve ser chamado uma vez no
// nível do módulo (não dentro de um componente).
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

if (!WEB_CLIENT_ID && !ANDROID_CLIENT_ID && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[GoogleSignIn] Nenhum CLIENT_ID configurado. Login com Google vai falhar até preencher EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e/ou EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID no .env.',
  );
}

interface UseGoogleSignInReturn {
  /** Dispara o fluxo de login. Erros são tratados internamente via Alert. */
  signInWithGoogle: () => Promise<void>;
  /** True enquanto o browser estiver aberto ou a request pro backend em curso. */
  loading: boolean;
  /** True se a configuração de OAuth não estiver pronta (sem CLIENT_ID). */
  notConfigured: boolean;
}

export const useGoogleSignIn = (): UseGoogleSignInReturn => {
  const { signInWithGoogle: applyGoogleAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const [, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    // Escopos: openid + email + profile. Pedimos só o necessário.
    scopes: ['openid', 'email', 'profile'],
  });

  const notConfigured = !WEB_CLIENT_ID && !ANDROID_CLIENT_ID;

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
      // 1. Abrir o browser do sistema. O Expo cuida do redirect URI:
      //    - dev (Expo Go): auth.expo.io/@<owner>/<slug>
      //    - prod (APK próprio): rolesc://...
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        // Usuário fechou o browser ou cancelou. Sem erro.
        return;
      }

      if (result.type !== 'success') {
        Alert.alert(
          'Não foi possível entrar',
          'Houve um problema na autenticação com o Google. Tente novamente.',
        );
        return;
      }

      const idToken = result.params.id_token;
      if (!idToken) {
        Alert.alert(
          'Não foi possível entrar',
          'Google não retornou as credenciais esperadas. Tente novamente.',
        );
        return;
      }

      // 2. Trocar id_token por JWT nosso via backend.
      await applyGoogleAuth(idToken);
    } catch (err) {
      Alert.alert('Não foi possível entrar', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyGoogleAuth, notConfigured, promptAsync]);

  return { signInWithGoogle, loading, notConfigured };
};
