import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, getCategorySolid, radius, spacing, typography } from '@/theme';

interface CategoriaBadgeProps {
  categoria: string | null | undefined;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

/**
 * Badge colorido por categoria (ex: "Cultura", "Esporte").
 * A cor é resolvida pelo mapa em theme/colors.ts.
 */
export const CategoriaBadge: React.FC<CategoriaBadgeProps> = ({
  categoria,
  style,
  size = 'md',
}) => {
  if (!categoria) return null;
  const bg = getCategorySolid(categoria);
  const padding = size === 'sm' ? styles.paddingSm : styles.paddingMd;

  return (
    <View style={[styles.badge, padding, { backgroundColor: bg }, style]}>
      <Text
        style={[
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colors.textOnPrimary },
        ]}
      >
        {categoria}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
  },
  paddingSm: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  paddingMd: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  textSm: { ...typography.caption, fontWeight: '700' },
  textMd: { ...typography.bodyBold },
});
