import api from './api';
import {
  EventosResponse,
  FavoritoIdsResponse,
  FavoritoToggleResponse,
} from '@/types';

interface ListFavoritosParams {
  page?: number;
  limit?: number;
}

/**
 * Favoritos são server-side: ficam na coleção `favoritos` do backend, atrelados
 * ao usuário do token. Antes isso vivia no AsyncStorage do aparelho, o que fazia
 * a lista ser do DISPOSITIVO e não da PESSOA — trocar de celular ou de conta
 * mostrava os favoritos errados.
 */
export const favoritosService = {
  /** Eventos favoritados, mais recém-favoritados primeiro (paginado). */
  async list(params: ListFavoritosParams = {}): Promise<EventosResponse> {
    const { data } = await api.get<EventosResponse>('/favoritos', { params });
    return data;
  },

  /** Ids de todos os favoritos, sem paginação — usado para o estado do coração. */
  async listIds(): Promise<string[]> {
    const { data } = await api.get<FavoritoIdsResponse>('/favoritos/ids');
    return data.data;
  },

  async add(eventoId: string): Promise<FavoritoToggleResponse> {
    const { data } = await api.post<FavoritoToggleResponse>(
      `/favoritos/${eventoId}`,
    );
    return data;
  },

  async remove(eventoId: string): Promise<FavoritoToggleResponse> {
    const { data } = await api.delete<FavoritoToggleResponse>(
      `/favoritos/${eventoId}`,
    );
    return data;
  },
};
