import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme';

interface ScreenBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}

/**
 * Fundo padrão do app — gradiente suave azul-claro usado em todas as telas
 * (login, home, favoritos, perfil), conforme o protótipo.
 */
export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
