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
import { extractErrorMessage } from '@/services/api';
import { authService, getApiErrorCode } from '@/services/auth.service';
import { colors, spacing, typography } from '@/theme';
import { API_ERROR_CODES } from '@/types';
import { validatePassword } from '@/utils/password';

import { PerfilStackScreenProps } from '@/navigation/types';

type Props = PerfilStackScreenProps<'AlterarSenha'>;

/**
 * Tela de alteração de senha do usuário logado.
 * Requer a senha atual + nova senha (com checklist de força ao vivo).
 * Não exige re-login após sucesso (decisão UX — ver CONTRATO_ALTERAR_SENHA.md
 * seção 11). Em caso de senha atual incorreta, dá feedback específico.
 */
export const AlterarSenhaScreen: React.FC<Props> = ({ navigation }) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = validatePassword(novaSenha);

  const senhasIguais = confirmarSenha.length > 0 && novaSenha === confirmarSenha;
  const senhasDiferentes =
    confirmarSenha.length > 0 && novaSenha !== confirmarSenha;
  const senhaIgualAtual =
    senhaAtual.length > 0 && novaSenha.length > 0 && novaSenha === senhaAtual;

  const handleSave = async () => {
    if (senhaAtual.length === 0) {
      Alert.alert('Atenção', 'Informe sua senha atual.');
      return;
    }
    if (!strength.isValid) {
      Alert.alert(
        'Senha fraca',
        'A nova senha precisa cumprir todos os requisitos abaixo.',
      );
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (senhaIgualAtual) {
      Alert.alert(
        'Atenção',
        'A nova senha precisa ser diferente da senha atual.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await authService.changePassword(senhaAtual, novaSenha);
      Alert.alert(
        'Senha alterada',
        'Sua senha foi atualizada com sucesso.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      if (getApiErrorCode(err) === API_ERROR_CODES.INVALID_CURRENT_PASSWORD) {
        Alert.alert(
          'Senha incorreta',
          'A senha atual está incorreta. Tente novamente.',
        );
        setSenhaAtual('');
        return;
      }
      Alert.alert('Erro', extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    senhaAtual.length === 0 ||
    !strength.isValid ||
    novaSenha !== confirmarSenha ||
    senhaIgualAtual;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
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
            <Text style={styles.title}>Alterar senha</Text>
            <Text style={styles.subtitle}>
              Para sua segurança, confirme sua senha atual antes de definir uma
              nova.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="lock-closed-outline"
              placeholder="Senha atual"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              isPassword
              autoFocus
            />

            <Input
              icon="lock-closed-outline"
              placeholder="Nova senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              isPassword
            />

            <PasswordStrengthMeter password={novaSenha} />

            {senhaIgualAtual ? (
              <View style={styles.matchRow}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.matchText, { color: colors.danger }]}>
                  A nova senha precisa ser diferente da atual.
                </Text>
              </View>
            ) : null}

            <Input
              icon="lock-closed-outline"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {senhasIguais && !senhaIgualAtual ? (
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
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.matchText, { color: colors.danger }]}>
                  As senhas não coincidem.
                </Text>
              </View>
            ) : null}

            <Button
              label="Salvar nova senha"
              onPress={handleSave}
              loading={submitting}
              disabled={submitDisabled}
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
  content: {
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
