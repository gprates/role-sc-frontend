import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventoCard } from '@/components/EventoCard';
import { useFavoritos } from '@/hooks/useFavoritos';
import { colors, spacing, typography } from '@/theme';

import { FavoritosStackScreenProps } from '@/navigation/types';

type Props = FavoritosStackScreenProps<'FavoritosList'>;

export const FavoritosScreen: React.FC<Props> = ({ navigation }) => {
  const { favoritos, toggle, refresh } = useFavoritos();

  // Recarrega sempre que a aba ganhar foco, para refletir mudanças feitas no
  // detalhe ou na home sem precisar de event bus.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={favoritos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <EventoCard
            evento={item}
            favorito
            onToggleFavorito={() => {
              void toggle(item);
            }}
            onPress={() =>
              navigation.navigate('DetalheEvento', { id: item._id })
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Favoritos</Text>
            <Text style={styles.subtitle}>
              {favoritos.length}{' '}
              {favoritos.length === 1 ? 'evento salvo' : 'eventos salvos'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Nenhum favorito ainda"
            subtitle="Toque no coração de um evento para salvá-lo aqui."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
