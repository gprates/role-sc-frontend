import { useCallback, useEffect, useRef, useState } from 'react';

import { comentariosService } from '@/services/comentarios.service';
import { extractErrorMessage } from '@/services/api';
import { Comentario, Pagination } from '@/types';

const PAGE_LIMIT = 20;

/**
 * Concatena a próxima página descartando ids que já estão na lista.
 *
 * A paginação é por OFFSET (`skip`) sobre uma lista ordenada do mais novo para
 * o mais antigo, então publicar um comentário empurra todo mundo uma posição
 * para baixo: o item que era o último da página 1 vira o primeiro da página 2
 * e voltaria repetido. Além do item duplicado na tela, isso geraria chaves
 * repetidas na FlatList.
 */
function juntarSemRepetir(
  atuais: Comentario[],
  novos: Comentario[],
): Comentario[] {
  const jaTem = new Set(atuais.map((c) => c._id));
  return [...atuais, ...novos.filter((c) => !jaTem.has(c._id))];
}

interface UseComentariosState {
  comentarios: Comentario[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: Pagination | null;
}

interface UseComentariosReturn extends UseComentariosState {
  /**
   * Total de comentários do evento — vem de `pagination.total`, então conta
   * TODOS e não só os que já foram carregados. É esse número que aparece no
   * contador da barra de ações, por isso o hook é montado na tela de detalhe
   * e não dentro do modal.
   */
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  criar: (texto: string) => Promise<void>;
  editar: (comentarioId: string, texto: string) => Promise<void>;
  excluir: (comentarioId: string) => Promise<void>;
  toggleCurtida: (comentario: Comentario) => Promise<void>;
}

/**
 * Estado da lista de comentários de UM evento.
 *
 * Diferente dos favoritos, isso não precisa de contexto global: comentários só
 * aparecem na tela de detalhe do evento, então o estado pode morrer junto com
 * ela. A tela de detalhe monta o hook e passa tanto o `total` (para o contador
 * da barra) quanto as ações (para o modal).
 *
 * Criar/editar/excluir são otimistas onde dá, mas com uma diferença
 * importante: o item criado só entra na lista com a resposta do servidor,
 * porque é ela que traz o `_id` real — sem ele o usuário poderia tentar curtir
 * ou excluir um comentário que ainda não existe no banco. Curtir, editar e
 * excluir são otimistas de verdade (com rollback), já que o id já existe.
 */
export const useComentarios = (eventoId: string): UseComentariosReturn => {
  const [state, setState] = useState<UseComentariosState>({
    comentarios: [],
    loading: true,
    refreshing: false,
    loadingMore: false,
    error: null,
    pagination: null,
  });

  // Descarta respostas de requisições antigas (mesma proteção do useEventos).
  const requestIdRef = useRef(0);

  // Espelho síncrono do state: `loadMore` é passado para o `onEndReached` da
  // FlatList, que pode dispará-lo várias vezes seguidas — ler o state pelas
  // deps traria o valor do render anterior e deixaria passar chamadas
  // duplicadas da mesma página.
  const stateRef = useRef(state);
  stateRef.current = state;

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
        const res = await comentariosService.list(eventoId, {
          page,
          limit: PAGE_LIMIT,
        });
        if (myRequestId !== requestIdRef.current) return;

        setState((prev) => ({
          comentarios:
            mode === 'more'
              ? juntarSemRepetir(prev.comentarios, res.data)
              : res.data,
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
    [eventoId],
  );

  useEffect(() => {
    void fetchPage(1, 'initial');
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    await fetchPage(1, 'refresh');
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    const { loading, loadingMore, refreshing, pagination } = stateRef.current;
    if (loading || loadingMore || refreshing) return;
    if (!pagination) return;
    if (pagination.page >= pagination.totalPages) return;
    await fetchPage(pagination.page + 1, 'more');
  }, [fetchPage]);

  /** Ajusta `total`/`totalPages` quando entra ou sai um item da lista. */
  const shiftTotal = useCallback((delta: 1 | -1) => {
    setState((prev) => {
      if (!prev.pagination) return prev;
      const total = Math.max(prev.pagination.total + delta, 0);
      return {
        ...prev,
        pagination: {
          ...prev.pagination,
          total,
          totalPages: Math.max(Math.ceil(total / prev.pagination.limit), 1),
        },
      };
    });
  }, []);

  const criar = useCallback(
    async (texto: string) => {
      // Sem otimismo aqui: o `_id` só existe depois da resposta.
      const res = await comentariosService.create(eventoId, texto);
      setState((prev) => ({
        ...prev,
        comentarios: [res.data, ...prev.comentarios],
      }));
      shiftTotal(1);
    },
    [eventoId, shiftTotal],
  );

  const editar = useCallback(async (comentarioId: string, texto: string) => {
    const res = await comentariosService.update(comentarioId, texto);
    setState((prev) => ({
      ...prev,
      comentarios: prev.comentarios.map((c) =>
        c._id === comentarioId ? res.data : c,
      ),
    }));
  }, []);

  const excluir = useCallback(
    async (comentarioId: string) => {
      // Otimista: o comentário some na hora e volta se a API recusar. Sem
      // isso o item ficaria na tela durante o round-trip, dando a impressão
      // de que o toque não funcionou.
      let removido: Comentario | undefined;
      let indice = -1;

      setState((prev) => {
        indice = prev.comentarios.findIndex((c) => c._id === comentarioId);
        if (indice === -1) return prev;
        removido = prev.comentarios[indice];
        return {
          ...prev,
          comentarios: prev.comentarios.filter((c) => c._id !== comentarioId),
        };
      });
      shiftTotal(-1);

      try {
        await comentariosService.remove(comentarioId);
      } catch (err) {
        if (removido) {
          const item = removido;
          const at = indice;
          setState((prev) => {
            const restaurada = [...prev.comentarios];
            restaurada.splice(at, 0, item);
            return { ...prev, comentarios: restaurada };
          });
          shiftTotal(1);
        }
        throw err;
      }
    },
    [shiftTotal],
  );

  const toggleCurtida = useCallback(async (comentario: Comentario) => {
    const alvo = !comentario.curtidoPorMim;

    const aplicar = (curtido: boolean, curtidas: number) =>
      setState((prev) => ({
        ...prev,
        comentarios: prev.comentarios.map((c) =>
          c._id === comentario._id
            ? { ...c, curtidoPorMim: curtido, curtidas }
            : c,
        ),
      }));

    // Otimista: o coração e o número reagem no toque.
    aplicar(alvo, Math.max(comentario.curtidas + (alvo ? 1 : -1), 0));

    try {
      // A resposta traz o contador REAL — outra pessoa pode ter curtido no
      // meio do caminho, então o palpite otimista é substituído pelo do
      // servidor em vez de ficar por cima dele.
      const res = alvo
        ? await comentariosService.curtir(comentario._id)
        : await comentariosService.descurtir(comentario._id);
      aplicar(res.data.curtidoPorMim, res.data.curtidas);
    } catch (err) {
      aplicar(comentario.curtidoPorMim, comentario.curtidas);
      throw err;
    }
  }, []);

  return {
    ...state,
    total: state.pagination?.total ?? state.comentarios.length,
    refresh,
    loadMore,
    criar,
    editar,
    excluir,
    toggleCurtida,
  };
};
