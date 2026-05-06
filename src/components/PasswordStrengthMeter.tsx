import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';
import {
  PASSWORD_REQUIREMENTS,
  PasswordStrength,
  validatePassword,
} from '@/utils/password';

interface PasswordStrengthMeterProps {
  password: string;
  /**
   * Se true, esconde o componente quando a senha está vazia.
   * Útil pra não poluir a tela antes do usuário começar a digitar.
   */
  hideWhenEmpty?: boolean;
}

/**
 * Checklist visual ao vivo dos requisitos de senha.
 * Cada regra fica vermelha (não cumprida) ou verde (cumprida) conforme o
 * usuário digita.
 */
export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  hideWhenEmpty = true,
}) => {
  const strength = useMemo<PasswordStrength>(
    () => validatePassword(password),
    [password],
  );

  if (hideWhenEmpty && password.length === 0) return null;

  return (
    <View style={styles.container}>
      {PASSWORD_REQUIREMENTS.map((req) => {
        const ok = strength[req.key];
        return (
          <View key={req.key} style={styles.row}>
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={ok ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: ok ? colors.success : colors.textMuted },
              ]}
            >
              {req.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
  },
});
