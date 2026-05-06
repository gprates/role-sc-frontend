import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/services/api';
import {
  AvatarInvalidTypeError,
  AvatarTooLargeError,
  avatarService,
  PickedAsset,
} from '@/services/avatar.service';
import { AVATAR_MAX_SIZE_BYTES } from '@/types';

interface UseAvatarUploadReturn {
  uploading: boolean;
  /** Abre um Alert com 3 opções: Tirar foto / Galeria / Cancelar. */
  promptPickAndUpload: () => void;
}

/**
 * Hook que encapsula todo o fluxo de UI + permissão + picker + upload do avatar.
 * Componentes só precisam chamar `promptPickAndUpload()` e exibir um spinner
 * baseado em `uploading`.
 */
export const useAvatarUpload = (): UseAvatarUploadReturn => {
  const { patchUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (asset: PickedAsset) => {
      setUploading(true);
      try {
        const newUrl = await avatarService.uploadAvatar(asset);
        await patchUser({ avatarUrl: newUrl });
      } catch (err) {
        if (err instanceof AvatarTooLargeError) {
          Alert.alert(
            'Imagem muito grande',
            `A imagem precisa ter no máximo ${AVATAR_MAX_SIZE_BYTES / 1024 / 1024}MB.`,
          );
          return;
        }
        if (err instanceof AvatarInvalidTypeError) {
          Alert.alert(
            'Tipo de imagem não suportado',
            'Aceitamos apenas JPG, PNG, WebP e GIF.',
          );
          return;
        }
        Alert.alert('Não foi possível enviar a foto', extractErrorMessage(err));
      } finally {
        setUploading(false);
      }
    },
    [patchUser],
  );

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Para tirar uma foto, precisamos de acesso à câmera.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    void upload(result.assets[0]);
  }, [upload]);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Para escolher uma foto, precisamos de acesso à galeria.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }
    // GIF: o expo-image-picker NÃO consegue editar/cropar GIF mantendo
    // animação. Por isso desativamos `allowsEditing` aqui e deixamos o
    // recorte visual (circle) acontecer no render do avatar.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    void upload(result.assets[0]);
  }, [upload]);

  const promptPickAndUpload = useCallback(() => {
    Alert.alert('Foto de perfil', 'Como quer adicionar?', [
      { text: 'Tirar foto', onPress: () => void pickFromCamera() },
      { text: 'Escolher da galeria', onPress: () => void pickFromLibrary() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [pickFromCamera, pickFromLibrary]);

  return { uploading, promptPickAndUpload };
};
