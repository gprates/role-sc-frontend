/**
 * Helpers de intervalo de datas para o filtro de período. Sem dependência de
 * libs externas de data, mesma filosofia do format.ts — operam sempre em
 * horário local (compatível com toBackendDate).
 */

export interface DateRange {
  from: Date;
  to: Date;
}

export const startOfDay = (d: Date): Date => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

export const endOfDay = (d: Date): Date => {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
};

export const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

export const isSameDay = (a: Date | null, b: Date | null): boolean => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/** Domingo da semana de `d` (semana considerada de segunda a domingo). */
const endOfWeek = (d: Date): Date => {
  const day = d.getDay(); // 0=domingo..6=sábado
  const diff = day === 0 ? 0 : 7 - day;
  return endOfDay(addDays(d, diff));
};

/** Segunda-feira da semana seguinte à de `d`. */
const nextMonday = (d: Date): Date => {
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  return startOfDay(addDays(d, diff));
};

/** De hoje até o fim desta semana (domingo). */
export const getEstaSemanaRange = (base: Date = new Date()): DateRange => ({
  from: startOfDay(base),
  to: endOfWeek(base),
});

/** Da segunda-feira à domingo da semana seguinte. */
export const getProximaSemanaRange = (base: Date = new Date()): DateRange => {
  const from = nextMonday(base);
  return { from, to: endOfDay(addDays(from, 6)) };
};

/** Do dia 1 ao último dia do mês seguinte ao de `base`. */
export const getProximoMesRange = (base: Date = new Date()): DateRange => {
  const year = base.getFullYear();
  const month = base.getMonth();
  const from = startOfDay(new Date(year, month + 1, 1));
  const to = endOfDay(new Date(year, month + 2, 0));
  return { from, to };
};

export interface QuickRangeOption {
  key: string;
  label: string;
  getRange: (base?: Date) => DateRange;
}

export const QUICK_RANGE_OPTIONS: QuickRangeOption[] = [
  { key: 'esta-semana', label: 'Esta semana', getRange: getEstaSemanaRange },
  { key: 'proxima-semana', label: 'Próxima semana', getRange: getProximaSemanaRange },
  { key: 'proximo-mes', label: 'Próximo mês', getRange: getProximoMesRange },
];

/** Formata "20/12" para rótulos compactos (chip de filtro). */
export const formatDayMonth = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

/** Formata "20/12/2026" para exibir dentro do modal de período. */
export const formatFullDate = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};
