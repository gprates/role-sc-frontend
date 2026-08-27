import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,  Pressable,  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { authService } from '@/services/auth.service';
import { extractErrorMessage } from '@/services/api';
import { getApiErrorCode } from '@/services/auth.service';
import { colors, radius, spacing, typography } from '@/theme';
import { API_ERROR_CODES } from '@/types';

import { AuthStackScreenProps } from '@/navigation/types';

type Props = AuthStackScreenProps<'ConfirmarCodigo'>;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Segunda etapa da recuperação de senha:
 * usuário digita o código de 6 dígitos recebido por email.
 * Em caso de sucesso, recebemos um resetToken e navegamos para RedefinirSenha.
 *
 * UX: usamos UM TextInput escondido com letter-spacing largo, em vez de 6
 * inputs separados com auto-focus. Mais simples, menos bugs, e o usuário pode
 * colar o código diretamente. O input "cell" visível é só estilo.
 */
export const ConfirmarCodigoScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  // Cooldown inicial: o usuário acabou de receber o email da tela anterior,
  // não faz sentido permitir reenvio imediato. Inicia já no cooldown.

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldown]);

  const handleChangeCode = (raw: string) => {
    // Aceita só dígitos e limita a CODE_LENGTH.
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
  };

  const handleSubmit = async () => {
    if (code.length !== CODE_LENGTH) {
      Alert.alert('Atenção', `Digite os ${CODE_LENGTH} dígitos do código.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await authService.verifyResetCode(email, code);
      navigation.navigate('RedefinirSenha', {
        email,
        resetToken: res.resetToken,
      });
    } catch (err) {
      const apiCode = getApiErrorCode(err);
      if (apiCode === API_ERROR_CODES.INVALID_RESET_CODE) {
        Alert.alert(
          'Código inválido',
          'O código informado está incorreto ou expirou. Solicite um novo se necessário.',
        );
        setCode('');
        inputRef.current?.focus();
        return;
      }
      Alert.alert('Erro', extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.forgotPassword(email);
      Alert.alert('Código reenviado', 'Cheque sua caixa de entrada novamente.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      Alert.alert('Erro', extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = resending || cooldown > 0;
  const resendLabel =
    cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código';

  // Renderiza as 6 "cells" mostrando o caractere correspondente do estado `code`.
  const cells = Array.from({ length: CODE_LENGTH }).map((_, idx) => {
    const char = code[idx] ?? '';
    const isFocused = idx === code.length;
    return (
      <View
        key={idx}
        style={[
          styles.cell,
          char ? styles.cellFilled : null,
          isFocused ? styles.cellFocused : null,
        ]}
      >
        <Text style={styles.cellText}>{char}</Text>
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
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
          <Text style={styles.title}>Confirme o código</Text>
          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para{' '}
            <Text style={styles.emailStrong}>{email}</Text>. Digite-o abaixo
            para continuar.
          </Text>
        </View>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.cellsRow}
        >
          {cells}
        </Pressable>

        {/* Input "real" escondido — captura toda a entrada do teclado */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChangeCode}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={CODE_LENGTH}
          autoFocus
          caretHidden
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />

        <View style={styles.actions}>
          <Button
            label="Confirmar"
            onPress={handleSubmit}
            loading={submitting}
            disabled={code.length !== CODE_LENGTH}
          />
          <Pressable
            onPress={handleResend}
            disabled={resendDisabled}
            hitSlop={8}
            style={styles.resendBtn}
          >
            <Text
              style={[
                styles.resendText,
                resendDisabled && styles.resendTextDisabled,
              ]}
            >
              {resendLabel}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.tipText}>O código expira em 15 minutos.</Text>
          </View>
          <View style={styles.tipDivider} />
          <View style={styles.tipRow}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.tipText}>
              Não esqueça de olhar a pasta de spam.
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
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
  emailStrong: { ...typography.bodyBold, color: colors.textPrimary },

  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: colors.primary,
  },
  cellFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  cellText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  actions: { gap: spacing.sm, marginTop: spacing.md },
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  resendText: { ...typography.bodyBold, color: colors.primary },
  resendTextDisabled: { color: colors.textMuted },

  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tipText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  tipDivider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
});
