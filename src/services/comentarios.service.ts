import api from './api';
import {
  ComentarioCurtidaResponse,
  ComentarioDeleteResponse,
  ComentarioResponse,
  ComentariosResponse,
} from '@/types';

interface ListComentariosParams {
  page?: number;
  limit?: number;
}

/**
 * Comentários são PÚBLICOS: a listagem traz os de todos os usuários, e o
 * backend marca em cada item se ele é meu (`meu`) e se eu curti
 * (`curtidoPorMim`). Escrever/editar/excluir só vale para os próprios — o
 * servidor devolve 403 se alguém tentar contornar a UI.
 */
export const comentariosService = {
  /** Comentários de um evento, mais recentes primeiro (paginado). */
  async list(
    eventoId: string,
    params: ListComentariosParams = {},
  ): Promise<ComentariosResponse> {
    const { data } = await api.get<ComentariosResponse>(
      `/eventos/${eventoId}/comentarios`,
      { params },
    );
    return data;
  },

  async create(eventoId: string, texto: string): Promise<ComentarioResponse> {
    const { data } = await api.post<ComentarioResponse>(
      `/eventos/${eventoId}/comentarios`,
      { texto },
    );
    return data;
  },

  async update(
    comentarioId: string,
    texto: string,
  ): Promise<ComentarioResponse> {
    const { data } = await api.patch<ComentarioResponse>(
      `/comentarios/${comentarioId}`,
      { texto },
    );
    return data;
  },

  async remove(comentarioId: string): Promise<ComentarioDeleteResponse> {
    const { data } = await api.delete<ComentarioDeleteResponse>(
      `/comentarios/${comentarioId}`,
    );
    return data;
  },

  async curtir(comentarioId: string): Promise<ComentarioCurtidaResponse> {
    const { data } = await api.post<ComentarioCurtidaResponse>(
      `/comentarios/${comentarioId}/curtida`,
    );
    return data;
  },

  async descurtir(comentarioId: string): Promise<ComentarioCurtidaResponse> {
    const { data } = await api.delete<ComentarioCurtidaResponse>(
      `/comentarios/${comentarioId}/curtida`,
    );
    return data;
  },
};
