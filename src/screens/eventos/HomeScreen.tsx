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
import { FilterSelectModal } from '@/components/FilterSelectModal';
import { PeriodoFilterModal } from '@/components/PeriodoFilterModal';
import { useEventos } from '@/hooks/useEventos';
import { useFavoritos } from '@/hooks/useFavoritos';
import { colors, radius, spacing, typography } from '@/theme';
import { EventosFilter } from '@/types';
import { CATEGORIAS, MUNICIPIOS_FIXOS } from '@/utils/constants';
import { formatDayMonth } from '@/utils/dateRange';
import { toBackendDate } from '@/utils/format';

import { HomeStackScreenProps } from '@/navigation/types';

type Props = HomeStackScreenProps<'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [municipio, setMunicipio] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  const [municipioModalVisible, setMunicipioModalVisible] = useState(false);
  const [categoriaModalVisible, setCategoriaModalVisible] = useState(false);
  const [periodoModalVisible, setPeriodoModalVisible] = useState(false);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(handle);
  }, [search]);

  const filter = useMemo<EventosFilter>(
    () => ({
      search: debouncedSearch || undefined,
      municipio: municipio ?? undefined,
      categoria: categoria ?? undefined,
      dataInicio: dataInicio ? toBackendDate(dataInicio) : undefined,
      dataFim: dataFim ? toBackendDate(dataFim) : undefined,
    }),
    [debouncedSearch, municipio, categoria, dataInicio, dataFim],
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
    if (dataInicio || dataFim) c++;
    return c;
  }, [municipio, categoria, dataInicio, dataFim]);

  const clearFilters = useCallback(() => {
    setMunicipio(null);
    setCategoria(null);
    setDataInicio(null);
    setDataFim(null);
  }, []);

  const periodoLabel = useMemo(() => {
    if (dataInicio && dataFim) {
      return `${formatDayMonth(dataInicio)} - ${formatDayMonth(dataFim)}`;
    }
    if (dataInicio) return `A partir de ${formatDayMonth(dataInicio)}`;
    if (dataFim) return `Até ${formatDayMonth(dataFim)}`;
    return 'Período';
  }, [dataInicio, dataFim]);

  // IMPORTANTE: este header CONTÉM um TextInput (busca). Por isso não pode ser
  // passado como FUNÇÃO para `ListHeaderComponent` — a FlatList desmonta e
  // remonta o header a cada mudança de referência da função, fazendo o
  // TextInput perder foco e o teclado fechar a cada keystroke.
  // Solução: chamar `renderHeader()` na prop pra passar JSX (elemento) — a
  // FlatList apenas reconcilia a árvore mantendo a instância do TextInput viva.
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
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.sectionLabel}>FILTROS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <FilterChip
          icon="location-outline"
          label={municipio ?? 'Município'}
          active={!!municipio}
          onPress={() => setMunicipioModalVisible(true)}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={municipio ? colors.chipActiveText : colors.chipText}
            />
          }
        />
        <FilterChip
          icon="pricetag-outline"
          label={categoria ?? 'Categoria'}
          active={!!categoria}
          onPress={() => setCategoriaModalVisible(true)}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={categoria ? colors.chipActiveText : colors.chipText}
            />
          }
        />
        <FilterChip
          icon="calendar-outline"
          label={periodoLabel}
          active={!!(dataInicio || dataFim)}
          onPress={() => setPeriodoModalVisible(true)}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={dataInicio || dataFim ? colors.chipActiveText : colors.chipText}
            />
          }
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
      </ScrollView>

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
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="calendar-outline"
              title="Nenhum evento encontrado"
              subtitle="Tente ajustar os filtros ou volte mais tarde."
            />
          )
        }
        ListFooterComponent={renderFooter()}
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <FilterSelectModal
        visible={municipioModalVisible}
        onClose={() => setMunicipioModalVisible(false)}
        title="Município"
        options={MUNICIPIOS_FIXOS}
        selected={municipio}
        onApply={setMunicipio}
        searchPlaceholder="Buscar município..."
      />

      <FilterSelectModal
        visible={categoriaModalVisible}
        onClose={() => setCategoriaModalVisible(false)}
        title="Categoria"
        options={CATEGORIAS}
        selected={categoria}
        onApply={setCategoria}
        searchPlaceholder="Buscar categoria..."
      />

      <PeriodoFilterModal
        visible={periodoModalVisible}
        onClose={() => setPeriodoModalVisible(false)}
        dataInicio={dataInicio}
        dataFim={dataFim}
        onApply={(from, to) => {
          setDataInicio(from);
          setDataFim(to);
        }}
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
