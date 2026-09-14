import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Largura da ilustração, limitada a uma fração da tela em aparelhos estreitos. */
const IMAGE_WIDTH = 220;
const IMAGE_MAX_SCREEN_RATIO = 0.6;

interface EmptyStateProps {
  icon?: IconName;
  /**
   * Ilustração decorativa que substitui o círculo com ícone. Use só em estados
   * "vazio de verdade" — erros continuam com ícone pra não parecerem enfeite.
   */
  image?: ImageSourcePropType;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'calendar-outline',
  image,
  title,
  subtitle,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  const renderArt = () => {
    if (!image) {
      return (
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={38} color={colors.primary} />
        </View>
      );
    }
    // A altura sai da proporção do próprio asset, então cada ilustração pode
    // ter o formato que for sem distorcer.
    const { width, height } = Image.resolveAssetSource(image);
    const imageWidth = Math.min(IMAGE_WIDTH, screenWidth * IMAGE_MAX_SCREEN_RATIO);
    return (
      <Image
        source={image}
        style={[
          styles.image,
          { width: imageWidth, aspectRatio: width && height ? width / height : 1 },
        ]}
        accessible={false}
        importantForAccessibility="no"
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderArt()}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  image: {
    resizeMode: 'contain',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
