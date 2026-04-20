import { useCallback, useEffect, useRef, useState } from 'react';

import { eventoService } from '@/services/evento.service';
import { extractErrorMessage } from '@/services/api';
import { Evento, EventosFilter, Pagination } from '@/types';

interface UseEventosState {
  eventos: Evento[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: Pagination | null;
}

interface UseEventosReturn extends UseEventosState {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Hook para listar eventos com paginação / pull-to-refresh / scroll infinito.
 * Reexecuta automaticamente quando `filter` (memoizado pela tela) muda.
 */
export const useEventos = (filter: EventosFilter): UseEventosReturn => {
  const [state, setState] = useState<UseEventosState>({
    eventos: [],
    loading: true,
    refreshing: false,
    loadingMore: false,
    error: null,
    pagination: null,
  });

  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (page: number, mode: 'initial' | 'refresh' | 'more') => {
      const myRequestId = ++requestIdRef.current;

      setState((prev) => ({
        ...prev,
        loading: mode === 'initial',
        refreshing: mode === 'refresh',
        loadingMore: mode === 'more',
        error: null,
      }));

      try {
        const res = await eventoService.list({ ...filter, page, limit: 20 });
        if (myRequestId !== requestIdRef.current) return;

        setState((prev) => ({
          eventos: mode === 'more' ? [...prev.eventos, ...res.data] : res.data,
          pagination: res.pagination,
          loading: false,
          refreshing: false,
          loadingMore: false,
          error: null,
        }));
      } catch (err) {
        if (myRequestId !== requestIdRef.current) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          loadingMore: false,
          error: extractErrorMessage(err),
        }));
      }
    },
    [filter],
  );

  useEffect(() => {
    void fetchPage(1, 'initial');
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    await fetchPage(1, 'refresh');
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    const { pagination, loading, loadingMore, refreshing } = state;
    if (loading || loadingMore || refreshing) return;
    if (!pagination) return;
    if (pagination.page >= pagination.totalPages) return;
    await fetchPage(pagination.page + 1, 'more');
  }, [fetchPage, state]);

  return { ...state, refresh, loadMore };
};
