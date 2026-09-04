import { Share } from 'react-native';

import { Evento } from '@/types';

/**
 * Compartilha um evento pela folha nativa do sistema.
 *
 * Fica aqui, e não dentro da tela, porque o mesmo gesto existe em dois lugares
 * (o card da listagem e a barra de ações do detalhe) — com a montagem da
 * mensagem duplicada, a assinatura do app acabaria divergindo entre os dois.
 *
 * As linhas são montadas em array e filtradas: eventos sem descrição deixavam
 * duas quebras seguidas no meio do texto quando isso era um template único.
 */
export const compartilharEvento = async (evento: Evento): Promise<void> => {
  const linhas = [
    evento.titulo,
    evento.descricao,
    `Veja mais: ${evento.url}`,
    'Compartilhado pelo app Rolê SC',
  ].filter(Boolean);

  try {
    await Share.share({
      message: linhas.join('\n\n'),
      title: evento.titulo,
    });
  } catch (err) {
    // Cancelar a folha de compartilhamento não é erro — só registramos falha
    // real, sem incomodar o usuário com um Alert por algo que ele mesmo fechou.
    console.warn('[share] falhou', err);
  }
};
