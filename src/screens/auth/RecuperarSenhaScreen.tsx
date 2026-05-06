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
import { authService, getApiErrorCode } from '@/services/auth.service';
import { extractErrorMessage } from '@/services/api';
import { colors, spacing, typography } from '@/theme';
import { API_ERROR_CODES } from '@/types';

import { AuthStackScreenProps } from '@/navigation/types';

type Props = AuthStackScreenProps<'RecuperarSenha'>;

/**
 * Primeira etapa da recuperação de senha:
 * o usuário informa o email, disparamos POST /auth/forgot-password e
 * navegamos para a tela ConfirmarCodigo (passando o email no param).
 *
 * Comportamento de erro:
 * - 404 USER_NOT_FOUND → mostra alert com atalho para Cadastro (pré-preenche o email)
 * - outros erros → alert genérico com extractErrorMessage
 */
export const RecuperarSenhaScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Atenção', 'Informe um email válido.');
      return;
    }
    const emailNormalizado = email.trim().toLowerCase();
    setSubmitting(true);
    try {
      await authService.forgotPassword(emailNormalizado);
      navigation.navigate('ConfirmarCodigo', { email: emailNormalizado });
    } catch (err) {
      if (getApiErrorCode(err) === API_ERROR_CODES.USER_NOT_FOUND) {
        Alert.alert(
          'Email não encontrado',
          'Não encontramos uma conta com esse email. Quer criar uma?',
          [
            { text: 'Tentar outro email', style: 'cancel' },
            {
              text: 'Criar conta',
              onPress: () =>
                navigation.navigate('Cadastro', { email: emailNormalizado }),
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
            <Text style={styles.backText}>Voltar ao login</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>
              Vamos enviar um código de 6 dígitos para o seu email.
            </Text>
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
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Button
              label="Enviar código"
              onPress={handleSubmit}
              loading={submitting}
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
    gap: spacing.lg,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.textSecondary },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.md, marginTop: spacing.md },
});
