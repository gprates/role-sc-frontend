import { useEffect, useState } from 'react';

/**
 * Retorna `value` com atraso de `delayMs`, resetando o timer a cada mudança.
 * Usado para evitar disparar buscas a cada tecla digitada.
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
