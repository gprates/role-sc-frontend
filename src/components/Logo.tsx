import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
}

/**
 * Logo circular do Rolê SC (capivara + "rolê SC"), a mesma identidade do site.
 * A arte é detalhada e fica ilegível em tamanhos pequenos — evite menos de
 * ~100px. O PNG já é recortado e tem fundo transparente, sem borda nem fundo.
 */
export const Logo: React.FC<LogoProps> = ({ size = 72 }) => {
  return (
    <Image
      source={require('../../assets/images/logo-role-sc.png')}
      style={[styles.image, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Logo do Rolê SC"
    />
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'contain',
  },
});
