import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
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
import { SecaoPeriodoHeader } from '@/components/SecaoPeriodoHeader';
import { StatusFilterModal } from '@/components/StatusFilterModal';
import { useEventos } from '@/hooks/useEventos';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { colors, radius, spacing, typography } from '@/theme';
import { Evento, EventosFilter, EventoStatus } from '@/types';
import { agruparPorPeriodo } from '@/utils/agruparPorPeriodo';
import { CATEGORIAS, MUNICIPIOS_FIXOS } from '@/utils/constants';
import { formatDayMonth } from '@/utils/dateRange';
import { toBackendDate } from '@/utils/format';

import { HomeStackScreenProps } from '@/navigation/types';

type Props = HomeStackScreenProps<'Home'>;

/** "Município" (nada selecionado) | "Itajaí" (1) | "Itajaí +2" (várias). */
const multiSelectLabel = (selected: string[], fallback: string): string => {
  if (selected.length === 0) return fallback;
  if (selected.length === 1) return selected[0];
  return `${selected[0]} +${selected.length - 1}`;
};

/**
 * Capivara "sentada" atrás do primeiro card da primeira seção, como no site.
 * Fica dentro do item da lista, presa ao card (não à largura da tela), então
 * rola junto com ele e a ilusão de estar apoiada se mantém.
 * ~82% da altura fica acima do card; os ombros somem por trás dele.
 */
const CAPIVARA_SOURCE = require('../../../assets/images/capivara.png');
const CAPIVARA_WIDTH = 92;
const CAPIVARA_HEIGHT = (() => {
  const { width, height } = Image.resolveAssetSource(CAPIVARA_SOURCE);
  return CAPIVARA_WIDTH * (height / width);
})();
const CAPIVARA_VISIBLE_RATIO = 0.82;

const STATUS_LABELS: Record<'ativos' | 'passados' | 'todos', string> = {
  ativos: 'Por vir',
  passados: 'Já aconteceram',
  todos: 'Todos',
};

interface SecaoLista {
  key: string;
  /** Vazio = lista única, sem cabeçalho de seção. */
  label: string;
  data: Evento[];
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [municipio, setMunicipio] = useState<string[]>([]);
  const [categoria, setCategoria] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  // Padrão "ativos": eventos passados não interessam tanto ao usuário quanto
  // os que ainda vão rolar, então a Home já abre filtrada pra "Por vir".
  const [status, setStatus] = useState<EventoStatus | undefined>('ativos');

  const [municipioModalVisible, setMunicipioModalVisible] = useState(false);
  const [categoriaModalVisible, setCategoriaModalVisible] = useState(false);
  const [periodoModalVisible, setPeriodoModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(handle);
  }, [search]);

  const filter = useMemo<EventosFilter>(
    () => ({
      search: debouncedSearch || undefined,
      municipio: municipio.length > 0 ? municipio.join(',') : undefined,
      categoria: categoria.length > 0 ? categoria.join(',') : undefined,
      dataInicio: dataInicio ? toBackendDate(dataInicio) : undefined,
      dataFim: dataFim ? toBackendDate(dataFim) : undefined,
      status,
    }),
    [debouncedSearch, municipio, categoria, dataInicio, dataFim, status],
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
    if (municipio.length > 0) c++;
    if (categoria.length > 0) c++;
    if (dataInicio || dataFim) c++;
    // "ativos" é o padrão da tela — só conta como filtro ativo quando o
    // usuário se afasta dele (passados ou todos).
    if (status !== 'ativos') c++;
    return c;
  }, [municipio, categoria, dataInicio, dataFim, status]);

  const clearFilters = useCallback(() => {
    setMunicipio([]);
    setCategoria([]);
    setDataInicio(null);
    setDataFim(null);
    setStatus('ativos');
  }, []);

  const periodoLabel = useMemo(() => {
    if (dataInicio && dataFim) {
      return `${formatDayMonth(dataInicio)} - ${formatDayMonth(dataFim)}`;
    }
    if (dataInicio) return `A partir de ${formatDayMonth(dataInicio)}`;
    if (dataFim) return `Até ${formatDayMonth(dataFim)}`;
    return 'Período';
  }, [dataInicio, dataFim]);

  const municipioLabel = multiSelectLabel(municipio, 'Município');
  const categoriaLabel = multiSelectLabel(categoria, 'Categoria');
  const statusLabel = STATUS_LABELS[status ?? 'todos'];

  // Só "Por vir" é agrupado por período; nos outros status a lista é única.
  // Recalcula sobre a lista acumulada a cada página que chega do scroll
  // infinito, então uma seção pode crescer conforme mais eventos carregam.
  const secoes = useMemo<SecaoLista[]>(() => {
    if (status === 'ativos') {
      return agruparPorPeriodo(eventos).map(({ key, label, eventos: data }) => ({
        key,
        label,
        data,
      }));
    }
    return eventos.length > 0 ? [{ key: 'todos', label: '', data: eventos }] : [];
  }, [eventos, status]);
  const primeiraSecaoKey = secoes[0]?.key;

  // IMPORTANTE: este header CONTÉM um TextInput (busca). Por isso não pode ser
  // passado como FUNÇÃO para `ListHeaderComponent` — a lista desmonta e
  // remonta o header a cada mudança de referência da função, fazendo o
  // TextInput perder foco e o teclado fechar a cada keystroke.
  // Solução: chamar `renderHeader()` na prop pra passar JSX (elemento) — a
  // lista apenas reconcilia a árvore mantendo a instância do TextInput viva.
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
          icon="time-outline"
          label={statusLabel}
          active={status !== 'ativos'}
          onPress={() => setStatusModalVisible(true)}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={status !== 'ativos' ? colors.chipActiveText : colors.chipText}
            />
          }
        />
        <FilterChip
          icon="location-outline"
          label={municipioLabel}
          active={municipio.length > 0}
          onPress={() => setMunicipioModalVisible(true)}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={municipio.length > 0 ? colors.chipActiveText : colors.chipText}
            />
          }
        />
        <FilterChip
          icon="pricetag-outline"
          label={categoriaLabel}
          active={categoria.length > 0}
          onPress={() => setCategoriaModalVisible(true)}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={categoria.length > 0 ? colors.chipActiveText : colors.chipText}
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

  const renderCard = (item: Evento) => (
    <EventoCard
      evento={item}
      onPress={() => navigation.navigate('DetalheEvento', { id: item._id })}
      favorito={isFavorito(item._id)}
      onToggleFavorito={() => {
        void toggle(item);
      }}
      onPressComentarios={() =>
        navigation.navigate('DetalheEvento', {
          id: item._id,
          abrirComentarios: true,
        })
      }
    />
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
      <SectionList<Evento, SecaoLista>
        sections={secoes}
        keyExtractor={(item) => item._id}
        stickySectionHeadersEnabled={false}
        // A FlatList liga isso sozinha no Android; a SectionList não. Sem ele,
        // todo card já carregado (sombra, elevation, imagem) continua sendo
        // desenhado mesmo fora da tela e o FPS despenca conforme a lista cresce.
        removeClippedSubviews={Platform.OS === 'android'}
        renderSectionHeader={({ section }) =>
          section.label ? (
            <SecaoPeriodoHeader
              label={section.label}
              total={section.data.length}
              style={
                section.key === primeiraSecaoKey
                  ? undefined
                  : styles.secaoHeaderEspacado
              }
            />
          ) : null
        }
        renderItem={({ item, index, section }) => {
          if (index !== 0 || section.key !== primeiraSecaoKey) {
            return renderCard(item);
          }
          // Decorativa e estática (sem animação — no site a de "espiar"
          // parecia bug). Fica no topo do wrapper e o card, desenhado depois,
          // cobre os ombros. No Android quem garante isso é a `elevation` do
          // card; aqui não pode ter elevation/zIndex senão ela passa por cima.
          return (
            <View style={styles.primeiroCard}>
              <View
                style={styles.capivara}
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Image source={CAPIVARA_SOURCE} style={styles.capivaraImage} />
              </View>
              {renderCard(item)}
            </View>
          );
        }}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          loading ? null : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Não foi possível carregar"
              subtitle="Puxe para baixo para tentar de novo."
            />
          ) : (
            <EmptyState
              image={require('../../../assets/images/barco.png')}
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

      <StatusFilterModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        value={status}
        onApply={setStatus}
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
  // Espaço maior entre uma seção e a anterior.
  secaoHeaderEspacado: { marginTop: spacing.xl },
  // Reserva acima do primeiro card a parte visível da capivara, pra ela não
  // invadir o cabeçalho da seção.
  primeiroCard: {
    paddingTop: CAPIVARA_HEIGHT * CAPIVARA_VISIBLE_RATIO,
  },
  capivara: {
    position: 'absolute',
    top: 0,
    right: spacing.lg,
    width: CAPIVARA_WIDTH,
    height: CAPIVARA_HEIGHT,
  },
  capivaraImage: { width: '100%', height: '100%', resizeMode: 'contain' },
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
