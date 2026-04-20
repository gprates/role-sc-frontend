import api from './api';
import { EventoResponse, EventosFilter, EventosResponse } from '@/types';

export const eventoService = {
  async list(filter: EventosFilter = {}): Promise<EventosResponse> {
    const { data } = await api.get<EventosResponse>('/eventos', {
      params: filter,
    });
    return data;
  },

  async getById(id: string): Promise<EventoResponse> {
    const { data } = await api.get<EventoResponse>(`/eventos/${id}`);
    return data;
  },
};
