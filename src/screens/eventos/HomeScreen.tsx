import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventoCard } from '@/components/EventoCard';
import { FilterChip } from '@/components/FilterChip';
import { useEventos } from '@/hooks/useEventos';
import { useFavoritos } from '@/hooks/useFavoritos';
import { colors, radius, spacing, typography } from '@/theme';
import { EventosFilter } from '@/types';
import { CATEGORIAS, MUNICIPIOS_FIXOS } from '@/utils/constants';

import { HomeStackScreenProps } from '@/navigation/types';

type Props = HomeStackScreenProps<'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [municipio, setMunicipio] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(handle);
  }, [search]);

  const filter = useMemo<EventosFilter>(
    () => ({
      search: debouncedSearch || undefined,
      municipio: municipio ?? undefined,
      categoria: categoria ?? undefined,
    }),
    [debouncedSearch, municipio, categoria],
  );

  const {
    eventos,
    loading,
    refreshing,
    loadingMore,
    error,
    pagination,
    refresh,
    loadMore,
  } = useEventos(filter);

  const { isFavorito, toggle } = useFavoritos();

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (municipio) c++;
    if (categoria) c++;
    return c;
  }, [municipio, categoria]);

  const clearFilters = useCallback(() => {
    setMunicipio(null);
    setCategoria(null);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={styles.greeting}>Olá! 👋</Text>
      <Text style={styles.title}>O que vai rolar hoje?</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <Text style={styles.sectionLabel}>MUNICÍPIO</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {MUNICIPIOS_FIXOS.map((m) => (
          <FilterChip
            key={m}
            label={m}
            active={municipio === m}
            onPress={() => setMunicipio((prev) => (prev === m ? null : m))}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>CATEGORIA</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIAS.map((c) => (
          <FilterChip
            key={c}
            label={c}
            active={categoria === c}
            onPress={() => setCategoria((prev) => (prev === c ? null : c))}
          />
        ))}
      </ScrollView>

      <View style={styles.extraRow}>
        <FilterChip
          icon="calendar-outline"
          label="Período"
          onPress={() => {
            // Em breve: date-picker nativo. Por enquanto não faz nada.
          }}
          disabled
        />
        <FilterChip
          icon="options-outline"
          label={
            activeFilterCount > 0
              ? `Limpar (${activeFilterCount})`
              : 'Limpar'
          }
          onPress={clearFilters}
          disabled={activeFilterCount === 0}
        />
      </View>

      <View style={styles.resultRow}>
        {loading ? (
          <Text style={styles.resultText}>Carregando eventos...</Text>
        ) : error ? (
          <Text style={[styles.resultText, { color: colors.danger }]}>
            {error}
          </Text>
        ) : (
          <Text style={styles.resultText}>
            {pagination?.total ?? 0}{' '}
            {pagination?.total === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={eventos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <EventoCard
            evento={item}
            onPress={() =>
              navigation.navigate('DetalheEvento', { id: item._id })
            }
            favorito={isFavorito(item._id)}
            onToggleFavorito={() => {
              void toggle(item);
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="calendar-outline"
              title="Nenhum evento encontrado"
              subtitle="Tente ajustar os filtros ou volte mais tarde."
            />
          )
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
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
  headerContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  greeting: { ...typography.body, color: colors.textSecondary },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  sectionLabel: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  chipsRow: { gap: spacing.xs, paddingVertical: spacing.xxs },
  extraRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  resultRow: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  resultText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLoading: { paddingVertical: spacing.md },
});
