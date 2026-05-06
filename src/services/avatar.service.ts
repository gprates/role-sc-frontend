import api from './api';
import {
  AVATAR_ACCEPTED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
  AvatarMimeType,
  ConfirmAvatarResponse,
  RequestAvatarUploadResponse,
} from '@/types';

export interface PickedAsset {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
}

export class AvatarTooLargeError extends Error {
  constructor(public readonly sizeBytes: number) {
    super(
      `Imagem muito grande (${(sizeBytes / 1024 / 1024).toFixed(1)}MB). O limite é ${AVATAR_MAX_SIZE_BYTES / 1024 / 1024}MB.`,
    );
    this.name = 'AvatarTooLargeError';
  }
}

export class AvatarInvalidTypeError extends Error {
  constructor(public readonly mimeType: string) {
    super(`Tipo de imagem não suportado: ${mimeType}.`);
    this.name = 'AvatarInvalidTypeError';
  }
}

const isAcceptedMime = (mime: string): mime is AvatarMimeType =>
  (AVATAR_ACCEPTED_MIME_TYPES as readonly string[]).includes(mime);

/**
 * Inferência conservadora de MIME type quando o image picker não traz a info.
 * Olha a extensão do filename ou da uri.
 */
const inferMimeType = (asset: PickedAsset): AvatarMimeType | null => {
  if (asset.mimeType && isAcceptedMime(asset.mimeType)) return asset.mimeType;
  const source = asset.fileName ?? asset.uri;
  const ext = source.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return null;
  }
};

export const avatarService = {
  /**
   * Fluxo completo de upload de avatar (3 etapas, transparente pro chamador):
   *
   * 1. POST /users/me/avatar/upload-url → recebe URL assinada e key
   * 2. PUT direto no S3 com o blob da imagem
   * 3. POST /users/me/avatar/confirm → backend valida e atualiza user.avatarUrl
   *
   * Retorna a URL pública final do avatar (já com cache busting).
   *
   * Lança AvatarTooLargeError ou AvatarInvalidTypeError nas validações
   * client-side (antes de qualquer request HTTP).
   */
  async uploadAvatar(asset: PickedAsset): Promise<string> {
    const mimeType = inferMimeType(asset);
    if (!mimeType) {
      throw new AvatarInvalidTypeError(asset.mimeType ?? 'desconhecido');
    }

    // Validação client-side de tamanho. fileSize pode ser null em alguns
    // pickers (ex: GIF da galeria em alguns devices); nesse caso pulamos a
    // validação local e deixamos o backend rejeitar.
    if (
      asset.fileSize !== null &&
      asset.fileSize !== undefined &&
      asset.fileSize > AVATAR_MAX_SIZE_BYTES
    ) {
      throw new AvatarTooLargeError(asset.fileSize);
    }

    const sizeBytes = asset.fileSize ?? 0;

    // Etapa 1: pedir presigned URL ao backend.
    const { data: uploadData } = await api.post<RequestAvatarUploadResponse>(
      '/users/me/avatar/upload-url',
      { contentType: mimeType, sizeBytes },
    );

    // Etapa 2: ler o blob da imagem (file:// uri do picker → fetch funciona em RN).
    const blob = await (await fetch(asset.uri)).blob();

    const putResponse = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: uploadData.headers,
      body: blob,
    });

    if (!putResponse.ok) {
      throw new Error(
        `Falha no upload pra S3 (HTTP ${putResponse.status}). Tente novamente.`,
      );
    }

    // Etapa 3: confirmar com o backend.
    const { data: confirmData } = await api.post<ConfirmAvatarResponse>(
      '/users/me/avatar/confirm',
      { key: uploadData.key },
    );

    return confirmData.avatarUrl;
  },
};
