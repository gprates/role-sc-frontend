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
import { authService } from '@/services/auth.service';
import { extractErrorMessage } from '@/services/api';
import { getApiErrorCode } from '@/services/auth.service';
import { colors, spacing, typography } from '@/theme';
import { API_ERROR_CODES } from '@/types';
import { validatePassword } from '@/utils/password';

import { AuthStackScreenProps } from '@/navigation/types';

type Props = AuthStackScreenProps<'RedefinirSenha'>;

/**
 * Etapa final da recuperação de senha:
 * o usuário define a nova senha (com checklist de força ao vivo) e
 * confirmamos via POST /auth/reset-password usando o resetToken obtido
 * em /auth/verify-reset-code.
 */
export const RedefinirSenhaScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, resetToken } = route.params;

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = validatePassword(novaSenha);

  const handleSubmit = async () => {
    if (!strength.isValid) {
      Alert.alert(
        'Senha fraca',
        'A senha precisa cumprir todos os requisitos antes de ser salva.',
      );
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(email, resetToken, novaSenha);
      Alert.alert(
        'Senha redefinida',
        'Sua senha foi alterada com sucesso. Faça login com a nova senha.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (err) {
      const apiCode = getApiErrorCode(err);
      if (apiCode === API_ERROR_CODES.INVALID_RESET_TOKEN) {
        Alert.alert(
          'Link expirado',
          'O processo de recuperação expirou. Vamos recomeçar.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('RecuperarSenha'),
            },
          ],
        );
        return;
      }
      Alert.alert('Erro', extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const senhasIguais =
    confirmarSenha.length > 0 && novaSenha === confirmarSenha;
  const senhasDiferentes =
    confirmarSenha.length > 0 && novaSenha !== confirmarSenha;

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
            <Text style={styles.title}>Nova senha</Text>
            <Text style={styles.subtitle}>
              Escolha uma senha segura. Os requisitos abaixo precisam ser
              atendidos.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="lock-closed-outline"
              placeholder="Nova senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              isPassword
              autoFocus
            />

            <PasswordStrengthMeter password={novaSenha} />

            <Input
              icon="lock-closed-outline"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {senhasIguais ? (
              <View style={styles.matchRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={[styles.matchText, { color: colors.success }]}>
                  As senhas conferem.
                </Text>
              </View>
            ) : null}

            {senhasDiferentes ? (
              <View style={styles.matchRow}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.danger}
                />
                <Text style={[styles.matchText, { color: colors.danger }]}>
                  As senhas não coincidem.
                </Text>
              </View>
            ) : null}

            <Button
              label="Redefinir senha"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!strength.isValid || novaSenha !== confirmarSenha}
              style={{ marginTop: spacing.sm }}
            />
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
    gap: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.textSecondary },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: { gap: spacing.md, marginTop: spacing.md },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -spacing.xs,
  },
  matchText: { ...typography.caption },
});
