import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Input } from '@/components/Input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { extractErrorMessage } from '@/services/api';
import { getApiErrorCode } from '@/services/auth.service';
import { colors, spacing, typography } from '@/theme';
import { API_ERROR_CODES } from '@/types';

import { AuthStackScreenProps } from '@/navigation/types';

type Props = AuthStackScreenProps<'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, submitting } = useAuth();
  const {
    signInWithGoogle,
    loading: googleLoading,
    notConfigured: googleNotConfigured,
  } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !senha) {
      Alert.alert('Campos obrigatórios', 'Preencha email e senha para entrar.');
      return;
    }
    const emailNormalizado = email.trim().toLowerCase();
    try {
      await signIn(emailNormalizado, senha);
    } catch (err) {
      // Caso especial: backend responde 403 com code EMAIL_NOT_VERIFIED
      // quando a conta existe mas o email ainda não foi confirmado.
      // Em vez de um alert genérico, levamos o usuário para a tela de
      // verificação com opção de reenviar o email.
      if (getApiErrorCode(err) === API_ERROR_CODES.EMAIL_NOT_VERIFIED) {
        navigation.navigate('VerificarEmail', { email: emailNormalizado });
        return;
      }
      Alert.alert('Não foi possível entrar', extractErrorMessage(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size={88} />
            <Text style={styles.title}>Rolê SC</Text>
            <Text style={styles.subtitle}>Eventos do litoral catarinense</Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="mail-outline"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />
            <Input
              icon="lock-closed-outline"
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Pressable
              onPress={() => navigation.navigate('RecuperarSenha')}
              hitSlop={8}
              style={styles.forgotWrapper}
            >
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>

            <Button label="Entrar" onPress={handleSubmit} loading={submitting} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {!googleNotConfigured ? (
              <GoogleSignInButton
                onPress={() => void signInWithGoogle()}
                loading={googleLoading}
                disabled={submitting}
              />
            ) : null}

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Novo por aqui? </Text>
              <Pressable
                onPress={() => navigation.navigate('Cadastro')}
                hitSlop={8}
              >
                <Text style={styles.linkStrong}>Criar conta</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xxl,
  },
  header: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  title: {
    ...typography.display,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.md },
  forgotWrapper: { alignSelf: 'flex-end', marginVertical: spacing.xs },
  link: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.micro, color: colors.textMuted },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  bottomText: { ...typography.body, color: colors.textSecondary },
  linkStrong: { ...typography.bodyBold, color: colors.primary },
});
