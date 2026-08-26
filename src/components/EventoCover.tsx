import React, { useState } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

import { EventoCoverPlaceholder } from './EventoCoverPlaceholder';
import { colors } from '@/theme';

interface EventoCoverProps {
  imageUrl: string | null | undefined;
  categoria: string | null | undefined;
  style?: ViewStyle;
  height?: number;
}

/**
 * Capa do evento: usa a imagem vinda do crawler quando existe, senão
 * cai no gradiente da categoria. URLs de sites de prefeitura quebram com
 * frequência, então falha de carregamento também volta pro placeholder.
 */
export const EventoCover: React.FC<EventoCoverProps> = ({
  imageUrl,
  categoria,
  style,
  height = 200,
}) => {
  const [falhou, setFalhou] = useState(false);

  if (!imageUrl || falhou) {
    return (
      <EventoCoverPlaceholder
        categoria={categoria}
        style={style}
        height={height}
      />
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFalhou(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
});
