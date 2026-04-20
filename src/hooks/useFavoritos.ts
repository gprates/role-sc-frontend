import { useCallback, useEffect, useState } from 'react';

import { favoritosService } from '@/services/favoritos.service';
import { Evento } from '@/types';

interface UseFavoritosReturn {
  favoritos: Evento[];
  loading: boolean;
  isFavorito: (id: string) => boolean;
  toggle: (evento: Evento) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook para favoritos locais (AsyncStorage).
 * Mantém a lista em memória para resposta instantânea na UI.
 */
export const useFavoritos = (): UseFavoritosReturn => {
  const [favoritos, setFavoritos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await favoritosService.list();
    setFavoritos(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorito = useCallback(
    (id: string) => favoritos.some((e) => e._id === id),
    [favoritos],
  );

  const toggle = useCallback(
    async (evento: Evento): Promise<boolean> => {
      const { favorito, lista } = await favoritosService.toggle(evento);
      setFavoritos(lista);
      return favorito;
    },
    [],
  );

  return { favoritos, loading, isFavorito, toggle, refresh };
};
