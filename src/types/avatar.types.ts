/**
 * Tipos relacionados ao upload de avatar do usuário.
 * Ver CONTRATO_AVATAR.md para detalhes do fluxo completo.
 */

export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const AVATAR_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AvatarMimeType = (typeof AVATAR_ACCEPTED_MIME_TYPES)[number];

export interface RequestAvatarUploadBody {
  contentType: AvatarMimeType;
  sizeBytes: number;
}

export interface RequestAvatarUploadResponse {
  success: true;
  /** URL pré-assinada do S3 onde o frontend faz PUT direto. Validade ~5min. */
  uploadUrl: string;
  /** Key (caminho) do objeto no S3, usado depois pra confirmar. */
  key: string;
  /**
   * Headers exatos que o frontend DEVE incluir no PUT pra o S3 aceitar.
   * Tipicamente { 'Content-Type': '...' }, mas pode incluir mais.
   */
  headers: Record<string, string>;
}

export interface ConfirmAvatarBody {
  key: string;
}

export interface ConfirmAvatarResponse {
  success: true;
  /** URL pública do avatar (já com cache busting via ?v=...). */
  avatarUrl: string;
}
