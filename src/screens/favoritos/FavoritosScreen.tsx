import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventoCard } from '@/components/EventoCard';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { colors, spacing, typography } from '@/theme';

import { FavoritosStackScreenProps } from '@/navigation/types';

type Props = FavoritosStackScreenProps<'FavoritosList'>;

export const FavoritosScreen: React.FC<Props> = ({ navigation }) => {
  const {
    favoritos,
    loading,
    refreshing,
    loadingMore,
    error,
    pagination,
    toggle,
    refresh,
    loadMore,
  } = useFavoritos();

  // Revalida contra o servidor sempre que a aba ganha foco: o estado local já
  // vem sincronizado pelo contexto (favoritar na Home reflete aqui na hora),
  // mas isso pega mudanças feitas em outro aparelho.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const total = pagination?.total ?? favoritos.length;

  const renderSubtitle = () => {
    if (loading) return 'Carregando...';
    if (error) return error;
    return `${total} ${total === 1 ? 'evento salvo' : 'eventos salvos'}`;
  };

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
            onPressComentarios={() =>
              navigation.navigate('DetalheEvento', {
                id: item._id,
                abrirComentarios: true,
              })
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Favoritos</Text>
            <Text style={[styles.subtitle, error ? styles.subtitleError : null]}>
              {renderSubtitle()}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Não foi possível carregar"
              subtitle="Puxe para baixo para tentar de novo."
            />
          ) : (
            <EmptyState
              image={require('../../../assets/images/moinho.png')}
              title="Nenhum favorito ainda"
              subtitle="Toque no coração de um evento para salvá-lo aqui."
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={0.4}
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
  subtitleError: { color: colors.danger },
  footerLoading: {
    paddingVertical: spacing.lg,
  },
});
