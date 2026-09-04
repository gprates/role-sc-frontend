/**
 * Tipo Evento — espelha o shape retornado pelo backend (GET /eventos e /eventos/:id).
 * Datas chegam como string ISO no JSON; convertemos para Date no momento do uso.
 */
export interface Evento {
  _id: string;
  titulo: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  horario: string | null;
  local: string | null;
  categoria: string | null;
  imageUrl?: string | null;
  municipio: string;
  site: string;
  url: string;
  publishedAt: string;
  processedAt: string;
  // Anexado pelas agregações de listagem (GET /eventos e GET /favoritos).
  // Ausente em GET /eventos/:id, onde a contagem real vem do useComentarios.
  totalComentarios?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EventosResponse {
  success: true;
  data: Evento[];
  pagination: Pagination;
}

export interface EventoResponse {
  success: true;
  data: Evento;
}

export type EventoStatus = 'ativos' | 'passados';

export interface EventosFilter {
  municipio?: string;
  categoria?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: EventoStatus;
  search?: string;
  page?: number;
  limit?: number;
}
