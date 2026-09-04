import { Pagination } from './evento.types';

/**
 * Um comentário como a API devolve.
 *
 * `meu` e `curtidoPorMim` vêm calculados do servidor (a partir do JWT), então
 * o app não precisa comparar ids pra decidir se mostra "Editar/Excluir" nem
 * se o coraçãozinho está preenchido.
 */
export interface Comentario {
  _id: string;
  eventoId: string;
  texto: string;
  criadoEm: string;
  /** `null` = nunca editado. Diferente de null, o card mostra "· editado". */
  editadoEm: string | null;
  curtidas: number;
  curtidoPorMim: boolean;
  meu: boolean;
  autor: {
    _id: string;
    nome: string;
    avatarUrl?: string;
  };
}

/** GET /eventos/:id/comentarios */
export interface ComentariosResponse {
  success: true;
  data: Comentario[];
  pagination: Pagination;
}

/** POST /eventos/:id/comentarios e PATCH /comentarios/:id */
export interface ComentarioResponse {
  success: true;
  data: Comentario;
}

/** POST/DELETE /comentarios/:id/curtida — estado final do coraçãozinho. */
export interface ComentarioCurtidaResponse {
  success: true;
  data: {
    _id: string;
    curtidas: number;
    curtidoPorMim: boolean;
  };
}

/** DELETE /comentarios/:id */
export interface ComentarioDeleteResponse {
  success: true;
  data: {
    _id: string;
    excluido: true;
  };
}

/** Mesmo teto do backend (COMENTARIO_MAX_LENGTH) — usado no contador do input. */
export const COMENTARIO_MAX_LENGTH = 1000;
