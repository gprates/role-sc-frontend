/**
 * Microsoft Clarity (heatmaps e gravação de sessão).
 *
 * O Project ID vem de EXPO_PUBLIC_CLARITY_PROJECT_ID (.env local ou variável
 * de ambiente do EAS). Sem ele, o Clarity fica desligado. O SDK só grava em
 * Android 10+ (API 29); em versões anteriores o app roda normalmente, sem
 * enviar dados.
 */
const CLARITY_PROJECT_ID = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID;

/**
 * testID dos elementos com dados pessoais (nome, email, foto, código). No
 * React Native o Clarity mascara por testID: a regra `#clarityMask` precisa
 * estar cadastrada como "Mask" no painel do Clarity (Settings > Masking).
 * Campos de texto (TextInput) já são mascarados pelo SDK em todos os modos.
 */
export const CLARITY_MASK = 'clarityMask';

/** Inicializa o Clarity. Chamada uma vez, em index.ts. */
export const initClarity = (): void => {
  if (!CLARITY_PROJECT_ID) return;

  // O require fica dentro do try porque um update OTA pode chegar a um
  // binário antigo, sem o módulo nativo do Clarity: aí o app segue sem
  // gravação em vez de quebrar na abertura.
  try {
    const Clarity: typeof import('@microsoft/react-native-clarity') =
      require('@microsoft/react-native-clarity');
    Clarity.initialize(CLARITY_PROJECT_ID);
  } catch (err) {
    console.warn('[clarity] não foi possível inicializar', err);
  }
};
