import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CategoriaBadge } from './CategoriaBadge';
import { EventoCoverPlaceholder } from './EventoCoverPlaceholder';
import { colors, radius, spacing, typography } from '@/theme';
import { Evento } from '@/types';
import { formatCardDate } from '@/utils/format';

interface EventoCardProps {
  evento: Evento;
  onPress: () => void;
  favorito?: boolean;
  onToggleFavorito?: () => void;
}

export const EventoCard: React.FC<EventoCardProps> = ({
  evento,
  onPress,
  favorito = false,
  onToggleFavorito,
}) => {
  const data = formatCardDate(evento.dataInicio, evento.horario);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cover}>
        <EventoCoverPlaceholder categoria={evento.categoria} height={160} />
        {evento.categoria ? (
          <View style={styles.badgeWrapper}>
            <CategoriaBadge categoria={evento.categoria} />
          </View>
        ) : null}
        {onToggleFavorito ? (
          <Pressable
            onPress={onToggleFavorito}
            hitSlop={8}
            style={styles.favoriteBtn}
          >
            <Ionicons
              name={favorito ? 'heart' : 'heart-outline'}
              size={22}
              color={favorito ? colors.heart : colors.textPrimary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {evento.titulo}
        </Text>

        {data ? (
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.rowText}>{data}</Text>
          </View>
        ) : null}

        {evento.local ? (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={15} color={colors.primary} />
            <Text style={styles.rowText} numberOfLines={1}>
              {evento.local}
            </Text>
          </View>
        ) : null}

        <View style={styles.municipioChip}>
          <Text style={styles.municipioText}>{evento.municipio}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardPressed: { opacity: 0.95, transform: [{ scale: 0.995 }] },
  cover: { position: 'relative' },
  badgeWrapper: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  favoriteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  municipioChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chipBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  municipioText: {
    ...typography.caption,
    color: colors.chipText,
    fontWeight: '600',
  },
});
