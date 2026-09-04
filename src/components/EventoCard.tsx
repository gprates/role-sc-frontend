import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CategoriaBadge } from './CategoriaBadge';
import { EventoCover } from './EventoCover';
import { colors, radius, spacing, typography } from '@/theme';
import { Evento } from '@/types';
import { formatCardDate } from '@/utils/format';

interface EventoCardProps {
  evento: Evento;
  onPress: () => void;
  favorito?: boolean;
  onToggleFavorito?: () => void;
  /** Quando passado, mostra o contador de comentários no rodapé do card. */
  onPressComentarios?: () => void;
}

export const EventoCard: React.FC<EventoCardProps> = ({
  evento,
  onPress,
  favorito = false,
  onToggleFavorito,
  onPressComentarios,
}) => {
  const data = formatCardDate(evento.dataInicio, evento.horario);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cover}>
        <EventoCover
          imageUrl={evento.imageUrl}
          categoria={evento.categoria}
          height={160}
        />
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

        <View style={styles.footerRow}>
          <View style={styles.municipioChip}>
            <Text style={styles.municipioText}>{evento.municipio}</Text>
          </View>

          {/* Pressable aninhado dentro do Pressable do card: o toque no ícone
              é capturado aqui e NÃO dispara o `onPress` do card — mesmo
              arranjo já usado pelo coração sobre a capa. */}
          {onPressComentarios ? (
            <Pressable
              onPress={onPressComentarios}
              hitSlop={8}
              style={styles.comentariosBtn}
              accessibilityLabel={`Ver comentários de ${evento.titulo}`}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.comentariosCount}>
                {evento.totalComentarios ?? 0}
              </Text>
            </Pressable>
          ) : null}
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  municipioChip: {
    backgroundColor: colors.chipBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  comentariosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  comentariosCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  municipioText: {
    ...typography.caption,
    color: colors.chipText,
    fontWeight: '600',
  },
});
