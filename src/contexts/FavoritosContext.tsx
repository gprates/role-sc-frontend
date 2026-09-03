import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/services/api';
import { favoritosService } from '@/services/favoritos.service';
import { Evento, Pagination } from '@/types';

interface FavoritosContextValue {
  /** Eventos favoritados (página carregada da tela de Favoritos). */
  favoritos: Evento[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: Pagination | null;
  isFavorito: (id: string) => boolean;
  /** Alterna o favorito e devolve o estado final (true = favoritado). */
  toggle: (evento: Evento) => Promise<boolean>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const FavoritosContext = createContext<FavoritosContextValue | null>(null);

const PAGE_LIMIT = 20;

interface FavoritosProviderProps {
  children: ReactNode;
}

/**
 * Estado global dos favoritos do usuário logado.
 *
 * Por que um contexto e não um hook por tela: Home, Detalhe e Favoritos
 * mostram o MESMO coração. Com um hook independente por tela, cada uma tinha
 * a própria cópia do estado e favoritar na Home não refletia nas outras sem
 * um refetch. Aqui o estado é único e o toggle é otimista, então o coração
 * responde na hora e as três telas ficam em sincronia.
 *
 * `ids` é a fonte da verdade do "está favoritado?" — vem de /favoritos/ids,
 * que não é paginado. A lista `favoritos` (paginada) serve só para renderizar
 * a tela de Favoritos.
 */
export const FavoritosProvider: React.FC<FavoritosProviderProps> = ({
  children,
}) => {
  const { token } = useAuth();

  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [favoritos, setFavoritos] = useState<Evento[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Espelho síncrono de `ids`: o toggle precisa saber o estado ANTES de
  // agendar o setState, e ler o state direto no callback traria o valor do
  // render anterior em toques rápidos e seguidos.
  const idsRef = useRef<Set<string>>(new Set());
  const setIdsBoth = useCallback((next: Set<string>) => {
    idsRef.current = next;
    setIds(next);
  }, []);

  // Descarta respostas de requisições antigas (ex.: troca de usuário no meio
  // de um fetch), no mesmo espírito do useEventos.
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (page: number, mode: 'initial' | 'refresh' | 'more') => {
      const myRequestId = ++requestIdRef.current;

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);
      setError(null);

      try {
        // Na primeira página vale re-sincronizar os ids também: é o momento em
        // que o app pode ter ficado desatualizado (outro aparelho, app aberto
        // há muito tempo).
        const [res, idsRes] = await Promise.all([
          favoritosService.list({ page, limit: PAGE_LIMIT }),
          mode === 'more' ? Promise.resolve(null) : favoritosService.listIds(),
        ]);
        if (myRequestId !== requestIdRef.current) return;

        setFavoritos((prev) =>
          mode === 'more' ? [...prev, ...res.data] : res.data,
        );
        setPagination(res.pagination);
        if (idsRes) setIdsBoth(new Set(idsRes));
      } catch (err) {
        if (myRequestId !== requestIdRef.current) return;
        setError(extractErrorMessage(err));
      } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [setIdsBoth],
  );

  // Carrega ao logar e ZERA ao deslogar — sem isso os favoritos do usuário
  // anterior continuariam na tela até o próximo fetch.
  useEffect(() => {
    if (!token) {
      requestIdRef.current++;
      setIdsBoth(new Set());
      setFavoritos([]);
      setPagination(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }
    void fetchPage(1, 'initial');
  }, [token, fetchPage, setIdsBoth]);

  const refresh = useCallback(async () => {
    if (!token) return;
    await fetchPage(1, 'refresh');
  }, [token, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing) return;
    if (!pagination) return;
    if (pagination.page >= pagination.totalPages) return;
    await fetchPage(pagination.page + 1, 'more');
  }, [fetchPage, loading, loadingMore, refreshing, pagination]);

  /** Aplica o novo estado na UI (ids + lista) sem tocar na API. */
  const applyLocal = useCallback(
    (evento: Evento, favorito: boolean) => {
      const next = new Set(idsRef.current);
      if (favorito) next.add(evento._id);
      else next.delete(evento._id);
      setIdsBoth(next);

      setFavoritos((prev) => {
        if (!favorito) return prev.filter((e) => e._id !== evento._id);
        if (prev.some((e) => e._id === evento._id)) return prev;
        // Backend ordena por data de criação desc, então o recém-favoritado
        // entra no topo — mesma posição que teria após um refresh.
        return [evento, ...prev];
      });
    },
    [setIdsBoth],
  );

  const toggle = useCallback(
    async (evento: Evento): Promise<boolean> => {
      const anterior = idsRef.current.has(evento._id);
      const alvo = !anterior;

      applyLocal(evento, alvo);

      try {
        if (alvo) await favoritosService.add(evento._id);
        else await favoritosService.remove(evento._id);
        return alvo;
      } catch (err) {
        // Rollback: o coração volta ao que era, para a UI não mentir sobre o
        // que está gravado no servidor.
        applyLocal(evento, anterior);
        Alert.alert('Favoritos', extractErrorMessage(err));
        return anterior;
      }
    },
    [applyLocal],
  );

  const isFavorito = useCallback((id: string) => ids.has(id), [ids]);

  const value = useMemo<FavoritosContextValue>(
    () => ({
      favoritos,
      loading,
      refreshing,
      loadingMore,
      error,
      pagination,
      isFavorito,
      toggle,
      refresh,
      loadMore,
    }),
    [
      favoritos,
      loading,
      refreshing,
      loadingMore,
      error,
      pagination,
      isFavorito,
      toggle,
      refresh,
      loadMore,
    ],
  );

  return (
    <FavoritosContext.Provider value={value}>
      {children}
    </FavoritosContext.Provider>
  );
};

export const useFavoritos = (): FavoritosContextValue => {
  const ctx = useContext(FavoritosContext);
  if (!ctx) {
    throw new Error('useFavoritos deve ser usado dentro de <FavoritosProvider>');
  }
  return ctx;
};
