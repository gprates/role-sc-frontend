/**
 * Funções utilitárias de formatação. Mantidas sem dependência de libs externas
 * de data (date-fns, dayjs) para manter o bundle pequeno no Android.
 */

const MESES_ABREV = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const MESES_COMPLETO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
];

const parseIso = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

/**
 * Formata como "20 de dez • 19h" (usado nos cards da home e favoritos).
 * Se `horario` vier separado (ex: "19h"), mostra ele.
 * Se a data não tiver hora, omite a parte do horário.
 */
export const formatCardDate = (
  dataIso: string | null | undefined,
  horario: string | null | undefined,
): string => {
  const d = parseIso(dataIso);
  if (!d) return horario ?? '';

  const datePart = `${d.getUTCDate()} de ${MESES_ABREV[d.getUTCMonth()]}`;
  if (horario) return `${datePart} • ${horario}`;
  return datePart;
};

/**
 * Formata como "Quinta-Feira, 18 De Dezembro" (usado no detalhe).
 */
export const formatLongDate = (dataIso: string | null | undefined): string => {
  const d = parseIso(dataIso);
  if (!d) return '—';
  const dia = DIAS_SEMANA[d.getUTCDay()];
  return `${dia}, ${d.getUTCDate()} De ${MESES_COMPLETO[d.getUTCMonth()]}`;
};

/**
 * Formata como "Publicado em 27/11/2025".
 */
export const formatShortDate = (dataIso: string | null | undefined): string => {
  const d = parseIso(dataIso);
  if (!d) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = d.getUTCFullYear();
  return `${dd}/${mm}/${yy}`;
};

/**
 * Retorna YYYY-MM-DD (formato aceito pelo filtro do backend).
 */
export const toBackendDate = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${yy}-${mm}-${dd}`;
};
