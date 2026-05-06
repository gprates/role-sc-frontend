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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/services/api';
import { colors, spacing, typography } from '@/theme';
import { validatePassword } from '@/utils/password';

import { AuthStackScreenProps } from '@/navigation/types';

type Props = AuthStackScreenProps<'Cadastro'>;

export const CadastroScreen: React.FC<Props> = ({ navigation, route }) => {
  const { signUp, submitting } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const validate = (): string | null => {
    if (nome.trim().length < 2) return 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Informe um email válido.';
    }
    if (!validatePassword(senha).isValid) {
      return 'A senha precisa cumprir todos os requisitos abaixo.';
    }
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Atenção', err);
      return;
    }
    const emailNormalizado = email.trim().toLowerCase();
    try {
      await signUp(nome.trim(), emailNormalizado, senha);
      navigation.navigate('VerificarEmail', { email: emailNormalizado });
    } catch (e) {
      Alert.alert('Não foi possível criar a conta', extractErrorMessage(e));
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
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backRow}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              Junte-se ao Rolê SC e descubra tudo o que rola por perto.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="person-outline"
              placeholder="Nome completo"
              autoCapitalize="words"
              value={nome}
              onChangeText={setNome}
            />
            <Input
              icon="mail-outline"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <Input
              icon="lock-closed-outline"
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              isPassword
            />
            <PasswordStrengthMeter password={senha} />
            <Input
              icon="lock-closed-outline"
              placeholder="Confirmar senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Button
              label="Criar conta"
              onPress={handleSubmit}
              loading={submitting}
              style={{ marginTop: spacing.sm }}
            />

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Já tem conta? </Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                hitSlop={8}
              >
                <Text style={styles.linkStrong}>Entrar</Text>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.textSecondary },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.md, marginTop: spacing.md },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  bottomText: { ...typography.body, color: colors.textSecondary },
  linkStrong: { ...typography.bodyBold, color: colors.primary },
});
