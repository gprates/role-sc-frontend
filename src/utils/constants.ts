/**
 * Constantes fixas do app — devem ficar em sincronia com o backend.
 */

export const MUNICIPIOS_FIXOS = [
  'Itajaí',
  'Camboriú',
  'Balneário Camboriú',
  'Porto Belo',
  'Itapema',
  'Bombinhas',
] as const;

export type Municipio = (typeof MUNICIPIOS_FIXOS)[number];

/**
 * Categorias válidas — deve espelhar o array CATEGORIAS_VALIDAS do NLP Processor/API.
 */
export const CATEGORIAS = [
  'Cultura',
  'Esporte',
  'Gastronomia',
  'Educação',
  'Saúde',
  'Meio Ambiente',
  'Turismo',
  'Religião',
  'Outro',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const STORAGE_KEYS = {
  token: '@rolesc/token',
  user: '@rolesc/user',
} as const;

export const APP_VERSION = '1.0.0';
