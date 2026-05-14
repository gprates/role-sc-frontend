import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * Botão "Continuar com Google". Visual segue inspiração do guideline da
 * Google (fundo branco, texto cinza escuro), mas com logo monocromático
 * do Ionicons (sem precisar adicionar `react-native-svg` ao bundle).
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  label = 'Continuar com Google',
}) => {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator size="small" color="#3C4043" />
        ) : (
          <Ionicons name="logo-google" size={20} color="#4285F4" />
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      {/* Espelho do iconWrap pra manter o texto centralizado. */}
      <View style={styles.iconSpacer} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  iconWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 24 },
  label: {
    ...typography.bodyBold,
    color: '#3C4043',
    flex: 1,
    textAlign: 'center',
  },
});
