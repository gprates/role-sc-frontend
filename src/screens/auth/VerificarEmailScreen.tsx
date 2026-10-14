import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { authService } from '@/services/auth.service';
import { extractErrorMessage } from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme';
import { CLARITY_MASK } from '@/utils/clarity';

import { AuthStackScreenProps } from '@/navigation/types';

type Props = AuthStackScreenProps<'VerificarEmail'>;

/**
 * Tela exibida após o cadastro OU quando o login retorna EMAIL_NOT_VERIFIED.
 * Orienta o usuário a abrir o email e clicar no link.
 * Oferece reenvio do email com cooldown local de 60s (alinhado com o rate
 * limit do backend — ver CONTRATO_VERIFICACAO_EMAIL.md, seção 4.4).
 */
const RESEND_COOLDOWN_SECONDS = 60;

export const VerificarEmailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastResentAt, setLastResentAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(email);
      setLastResentAt(new Date());
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      Alert.alert('Erro', extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleGoLogin = () => {
    navigation.navigate('Login');
  };

  const resendDisabled = resending || cooldown > 0;
  const resendLabel = cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar email';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => navigation.navigate('Login')}
          hitSlop={12}
          style={styles.backRow}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar ao login</Text>
        </Pressable>

        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={40} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Verifique seu email</Text>
        {/* O testID fica no parágrafo todo: o <Text> aninhado do email não
            vira uma view nativa própria, então não dá pra mascarar só ele. */}
        <Text style={styles.subtitle} testID={CLARITY_MASK}>
          Enviamos um link de confirmação para{' '}
          <Text style={styles.emailStrong}>{email}</Text>. Abra sua caixa de
          entrada e clique no link para ativar sua conta.
        </Text>

        <View style={styles.tipsCard}>
          <TipRow
            icon="time-outline"
            text="O link expira em 24 horas."
          />
          <View style={styles.tipDivider} />
          <TipRow
            icon="alert-circle-outline"
            text="Não esqueça de olhar a pasta de spam."
          />
        </View>

        {lastResentAt ? (
          <View style={styles.successHint}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successHintText}>
              Se o email estiver cadastrado e pendente, enviamos um novo link.
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={resendLabel}
            onPress={handleResend}
            loading={resending}
            disabled={resendDisabled}
          />
          <Button
            label="Já verifiquei, entrar"
            onPress={handleGoLogin}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface TipRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const TipRow: React.FC<TipRowProps> = ({ icon, text }) => (
  <View style={styles.tipRow}>
    <Ionicons name={icon} size={18} color={colors.primary} />
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

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
  iconWrapper: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  emailStrong: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.md,
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
  tipText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  tipDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  successHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  successHintText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
