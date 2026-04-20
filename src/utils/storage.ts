import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Wrapper tipado do AsyncStorage com serialização JSON automática.
 * Centraliza o tratamento de erro — qualquer falha de storage retorna null,
 * para o app não quebrar se o armazenamento estiver corrompido.
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[storage.get] falha ao ler chave ${key}`, err);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[storage.set] falha ao salvar chave ${key}`, err);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage.remove] falha ao remover chave ${key}`, err);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (err) {
      console.warn(`[storage.multiRemove] falha`, err);
    }
  },
};
