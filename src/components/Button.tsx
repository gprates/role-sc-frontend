import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

/**
 * Botão padrão do app. A variante `primary` usa o gradiente azul do protótipo.
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          fullWidth && styles.fullWidth,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientFill}
        >
          <ButtonContent
            label={label}
            loading={loading}
            iconLeft={iconLeft}
            iconRight={iconRight}
            textStyleColor={colors.textOnPrimary}
          />
        </LinearGradient>
      </Pressable>
    );
  }

  const { bg, fg, border } = resolveColors(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles.solid,
        { backgroundColor: bg, borderColor: border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <ButtonContent
        label={label}
        loading={loading}
        iconLeft={iconLeft}
        iconRight={iconRight}
        textStyleColor={fg}
      />
    </Pressable>
  );
};

interface ButtonContentProps {
  label: string;
  loading: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  textStyleColor: string;
}

const ButtonContent: React.FC<ButtonContentProps> = ({
  label,
  loading,
  iconLeft,
  iconRight,
  textStyleColor,
}) => {
  if (loading) {
    return <ActivityIndicator color={textStyleColor} />;
  }
  return (
    <>
      {iconLeft}
      <Text style={[styles.label, { color: textStyleColor }]}>{label}</Text>
      {iconRight}
    </>
  );
};

const resolveColors = (
  variant: Variant,
): { bg: string; fg: string; border: string } => {
  switch (variant) {
    case 'secondary':
      return {
        bg: colors.surface,
        fg: colors.primary,
        border: colors.borderStrong,
      };
    case 'ghost':
      return { bg: 'transparent', fg: colors.primary, border: 'transparent' };
    case 'danger':
      return { bg: colors.surface, fg: colors.danger, border: colors.surface };
    default:
      return {
        bg: colors.primary,
        fg: colors.textOnPrimary,
        border: colors.primary,
      };
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gradientFill: {
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  label: { ...typography.bodyBold },
});
