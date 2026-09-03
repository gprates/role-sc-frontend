/**
 * Respostas das rotas /favoritos.
 *
 * A listagem (GET /favoritos) devolve EVENTOS completos, com o mesmo shape de
 * GET /eventos — por isso reaproveita `EventosResponse` em vez de ter um tipo
 * próprio.
 */

/** GET /favoritos/ids — só os ids, para marcar os corações da Home. */
export interface FavoritoIdsResponse {
  success: true;
  data: string[];
}

/** POST/DELETE /favoritos/:eventoId — estado final do favorito. */
export interface FavoritoToggleResponse {
  success: true;
  data: {
    eventoId: string;
    favorito: boolean;
  };
}
