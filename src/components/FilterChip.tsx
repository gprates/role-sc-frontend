import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface FilterChipProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  icon?: IconName;
  style?: ViewStyle;
  trailing?: React.ReactNode;
}

/**
 * Chip de filtro (município, categoria, período).
 * Quando `active`, aplica o gradiente azul do protótipo.
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active = false,
  disabled = false,
  onPress,
  icon,
  style,
  trailing,
}) => {
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={
            active
              ? colors.chipActiveText
              : disabled
                ? colors.chipDisabledText
                : colors.chipText
          }
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          active && styles.labelActive,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
      {trailing}
    </>
  );

  if (active) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={[styles.wrapper, style]}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.container}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.wrapper, style]}
    >
      <View
        style={[
          styles.container,
          styles.containerDefault,
          disabled && styles.containerDisabled,
        ]}
      >
        {content}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: 4,
  },
  containerDefault: {
    backgroundColor: colors.chipBackground,
  },
  containerDisabled: {
    backgroundColor: colors.chipDisabledBackground,
  },
  icon: { marginRight: 2 },
  label: {
    ...typography.captionBold,
    color: colors.chipText,
  },
  labelActive: { color: colors.chipActiveText },
  labelDisabled: { color: colors.chipDisabledText },
});
