import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius } from '@/theme';

interface LogoProps {
  size?: number;
}

/**
 * Logo quadrado do Rolê SC — letra "R" estilizada em gradiente azul.
 * Substitui a necessidade de um asset .png no bundle.
 */
export const Logo: React.FC<LogoProps> = ({ size = 72 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.letter, { fontSize: size * 0.55 }]}>R</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    color: '#0A1E3C',
    fontWeight: '900',
    fontStyle: 'italic',
  },
});
