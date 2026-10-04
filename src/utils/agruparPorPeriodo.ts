/**
 * Agrupa os eventos "Por vir" da Home em seções por período, igual à versão
 * web. Função pura (sem React, sem imports) pra poder ser testada isolada.
 *
 * Convenções:
 * - Semana de segunda a domingo; o "fim de semana" começa na sexta.
 * - `dataInicio` vem do backend só com o dia, em meia-noite UTC. O dia do
 *   evento sai dos componentes UTC (mesma convenção do `formatCardDate`) e é
 *   comparado com o "hoje" no horário local do aparelho.
 * - Dentro de cada seção a ordem da API é preservada; só a ordem das seções é
 *   fixa. Seções vazias não são devolvidas.
 */

export type PeriodoKey =
  | 'hoje'
  | 'em-cartaz'
  | 'esta-semana'
  | 'fim-de-semana'
  | 'semana-que-vem'
  | 'demais';

export interface SecaoPeriodo<T> {
  key: PeriodoKey;
  label: string;
  eventos: T[];
}

const SECOES: ReadonlyArray<{ key: PeriodoKey; label: string }> = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'em-cartaz', label: 'Em cartaz' },
  { key: 'esta-semana', label: 'Esta semana' },
  { key: 'fim-de-semana', label: 'Este fim de semana' },
  { key: 'semana-que-vem', label: 'Semana que vem' },
  { key: 'demais', label: 'Demais eventos' },
];

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Diferença em dias corridos entre o dia do evento e hoje (negativo = já
 * começou). As duas datas viram "dia puro" via Date.UTC, então horário de
 * verão não interfere na conta. `null` quando o evento não tem data válida.
 */
const diasAteOEvento = (
  dataIso: string | null | undefined,
  agora: Date,
): number | null => {
  if (!dataIso) return null;
  const d = new Date(dataIso);
  if (Number.isNaN(d.getTime())) return null;

  const diaEvento = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((diaEvento - hoje) / MS_POR_DIA);
};

const classificar = (dias: number | null, agora: Date): PeriodoKey => {
  if (dias === null) return 'demais';
  if (dias === 0) return 'hoje';
  // Começou antes de hoje: se a API devolveu no status "ativos", ainda rola.
  if (dias < 0) return 'em-cartaz';

  // 0 = segunda ... 6 = domingo
  const diaDaSemana = (agora.getDay() + 6) % 7;
  if (dias <= 3 - diaDaSemana) return 'esta-semana'; // até quinta
  if (dias <= 6 - diaDaSemana) return 'fim-de-semana'; // sexta a domingo
  if (dias <= 13 - diaDaSemana) return 'semana-que-vem';
  return 'demais';
};

export const agruparPorPeriodo = <T extends { dataInicio?: string | null }>(
  eventos: readonly T[],
  agora: Date = new Date(),
): SecaoPeriodo<T>[] => {
  const baldes = new Map<PeriodoKey, T[]>(SECOES.map((s) => [s.key, []]));

  for (const evento of eventos) {
    const key = classificar(diasAteOEvento(evento.dataInicio, agora), agora);
    baldes.get(key)!.push(evento);
  }

  return SECOES.map((s) => ({ ...s, eventos: baldes.get(s.key)! })).filter(
    (s) => s.eventos.length > 0,
  );
};
