import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, getCategoryGradient } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface EventoCoverPlaceholderProps {
  categoria: string | null | undefined;
  style?: ViewStyle;
  height?: number;
}

/**
 * Fallback da capa quando o evento não tem imagem própria.
 * Usa gradiente da cor da categoria + ícone representativo.
 */
export const EventoCoverPlaceholder: React.FC<EventoCoverPlaceholderProps> = ({
  categoria,
  style,
  height = 200,
}) => {
  const gradient = getCategoryGradient(categoria);
  const icon = categoryIcon(categoria);

  return (
    <View style={[styles.container, { height }, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name={icon} size={height * 0.35} color="rgba(255,255,255,0.65)" />
    </View>
  );
};

const categoryIcon = (categoria: string | null | undefined): IconName => {
  switch (categoria) {
    case 'Cultura':
      return 'color-palette-outline';
    case 'Esporte':
      return 'football-outline';
    case 'Gastronomia':
      return 'restaurant-outline';
    case 'Educação':
      return 'school-outline';
    case 'Saúde':
      return 'medkit-outline';
    case 'Meio Ambiente':
      return 'leaf-outline';
    case 'Turismo':
      return 'sunny-outline';
    case 'Religião':
      return 'flower-outline';
    default:
      return 'calendar-outline';
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
});
