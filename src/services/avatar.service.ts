// Importamos do submódulo `legacy` porque a nova API (default) do
// expo-file-system SDK 54 não inclui `uploadAsync` ainda. Ver:
// https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/
import * as FileSystem from 'expo-file-system/legacy';

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

const extToMime = (ext: string | undefined): AvatarMimeType | null => {
  switch (ext?.toLowerCase()) {
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

/**
 * Inferência conservadora de MIME type. Prioridade:
 * 1. `mimeType` do asset, se for um dos aceitos
 * 2. Normalização: `image/jpg` (variante errada comum) → `image/jpeg`
 * 3. Extensão do `fileName` (mais confiável que a uri, que em Android pode
 *    ser `content://media/external/images/123` sem extensão)
 * 4. Extensão da `uri`
 */
const inferMimeType = (asset: PickedAsset): AvatarMimeType | null => {
  if (asset.mimeType) {
    if (asset.mimeType === 'image/jpg') return 'image/jpeg';
    if (isAcceptedMime(asset.mimeType)) return asset.mimeType;
  }
  const fromFileName = extToMime(asset.fileName?.split('.').pop());
  if (fromFileName) return fromFileName;
  const fromUri = extToMime(asset.uri.split('?')[0]?.split('.').pop());
  return fromUri;
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

    // Descobrir o tamanho REAL do arquivo a partir do filesystem.
    // NÃO confiar em `asset.fileSize` do image picker: no Android, com URIs
    // `content://` (galeria), esse valor pode vir nulo ou diferente do
    // tamanho real que o `FileSystem.uploadAsync` vai mandar pro S3. Se o
    // backend assinou com um Content-Length diferente, S3 retorna 403
    // SignatureDoesNotMatch.
    const fileInfo = await FileSystem.getInfoAsync(asset.uri, { size: true });
    if (!fileInfo.exists) {
      throw new Error('Arquivo selecionado não foi encontrado.');
    }
    const sizeBytes = fileInfo.size;

    if (sizeBytes > AVATAR_MAX_SIZE_BYTES) {
      throw new AvatarTooLargeError(sizeBytes);
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[avatar] preparando upload: mime=${mimeType} size=${sizeBytes}B uri=${asset.uri.slice(0, 60)}...`,
      );
    }

    // Etapa 1: pedir presigned URL ao backend.
    const { data: uploadData } = await api.post<RequestAvatarUploadResponse>(
      '/users/me/avatar/upload-url',
      { contentType: mimeType, sizeBytes },
    );

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[avatar] presigned URL recebida, headers=${JSON.stringify(uploadData.headers)}`,
      );
    }

    // Etapa 2: PUT direto no S3 via expo-file-system.
    //
    // Por que NÃO usar `fetch(uri).blob() + fetch PUT` aqui?
    // - URIs `content://` (galeria do Android) não são bem suportadas por
    //   `fetch().blob()` em algumas versões do RN
    // - Quando body é Blob, o RN reescreve o header `Content-Type` para
    //   o tipo interno do blob — que pode diferir do que foi usado pra
    //   assinar a presigned URL → S3 responde 403 SignatureDoesNotMatch
    //
    // `FileSystem.uploadAsync` em modo BINARY_CONTENT faz stream binário
    // do arquivo respeitando exatamente os headers passados.
    const uploadResult = await FileSystem.uploadAsync(
      uploadData.uploadUrl,
      asset.uri,
      {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: uploadData.headers,
      },
    );

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(
          `[avatar] S3 PUT falhou (HTTP ${uploadResult.status})`,
          uploadResult.body,
        );
      }
      throw new Error(
        `Falha no upload pra S3 (HTTP ${uploadResult.status}). Tente novamente.`,
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
