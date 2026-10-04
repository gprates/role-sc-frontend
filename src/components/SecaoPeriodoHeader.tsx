import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, typography } from '@/theme';

interface SecaoPeriodoHeaderProps {
  label: string;
  total: number;
  style?: ViewStyle;
}

/**
 * Cabeçalho das seções por período da Home ("Hoje", "Esta semana"...):
 * barrinha com o gradiente da marca + título + pílula com o total + linha
 * fina ocupando o resto da largura.
 */
export const SecaoPeriodoHeader: React.FC<SecaoPeriodoHeaderProps> = ({
  label,
  total,
  style,
}) => (
  <View style={[styles.row, style]} accessibilityRole="header">
    <LinearGradient
      colors={colors.gradientPrimary}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.bar}
    />
    <Text style={styles.title}>{label}</Text>
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {total} {total === 1 ? 'evento' : 'eventos'}
      </Text>
    </View>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bar: { width: 4, height: 22, borderRadius: 2 },
  title: { ...typography.title, color: colors.primaryDark },
  pill: {
    backgroundColor: colors.chipBackground,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pillText: { ...typography.captionBold, color: colors.chipText },
  line: { flex: 1, height: 1, backgroundColor: colors.borderStrong },
});
