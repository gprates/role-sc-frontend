import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// KeyboardAvoidingView do react-native-keyboard-controller, não o do RN: o do
// RN não funciona dentro de <Modal> no Android (a janela do modal não recebe
// adjustResize), que é justamente o caso aqui — o teclado cobria o input.
import {
  KeyboardAvoidingView,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { extractErrorMessage } from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme';
import { COMENTARIO_MAX_LENGTH, Comentario } from '@/types';
import { CLARITY_MASK } from '@/utils/clarity';
import { formatRelativeTime } from '@/utils/format';

interface ComentariosModalProps {
  visible: boolean;
  onClose: () => void;
  comentarios: Comentario[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  total: number;
  onRefresh: () => Promise<void>;
  onLoadMore: () => Promise<void>;
  onCriar: (texto: string) => Promise<void>;
  onEditar: (comentarioId: string, texto: string) => Promise<void>;
  onExcluir: (comentarioId: string) => Promise<void>;
  onToggleCurtida: (comentario: Comentario) => Promise<void>;
}

/**
 * Bottom sheet de comentários do evento.
 *
 * O estado da lista mora no `useComentarios` da tela de detalhe (que precisa
 * do total para o contador da barra de ações mesmo com o modal fechado) — este
 * componente é só a apresentação, e recebe dados e ações por prop.
 *
 * O mesmo input serve para escrever e para editar: quando `editando` está
 * preenchido ele muda de rótulo e ganha um "cancelar", em vez de abrir um
 * segundo campo — é o comportamento do Instagram e evita dois lugares
 * diferentes para digitar a mesma coisa.
 */
export const ComentariosModal: React.FC<ComentariosModalProps> = ({
  visible,
  onClose,
  comentarios,
  loading,
  refreshing,
  loadingMore,
  error,
  total,
  onRefresh,
  onLoadMore,
  onCriar,
  onEditar,
  onExcluir,
  onToggleCurtida,
}) => {
  const [draft, setDraft] = useState('');
  const [editando, setEditando] = useState<Comentario | null>(null);
  const [enviando, setEnviando] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Comentario>>(null);

  const insets = useSafeAreaInsets();
  // Com o teclado aberto ele já cobre a barra de navegação, então somar o
  // inset embaixo do input abriria um vão morto entre o campo e o teclado.
  const tecladoAberto = useKeyboardState((estado) => estado.isVisible);
  const paddingInferior = tecladoAberto
    ? spacing.md
    : Math.max(insets.bottom, spacing.md);

  // Fechar e reabrir o modal recomeça do zero: um rascunho de meia hora atrás
  // (ou pior, uma edição pendente de um comentário que nem está mais na tela)
  // reaparecendo sem contexto confunde mais do que ajuda.
  useEffect(() => {
    if (!visible) {
      setDraft('');
      setEditando(null);
      setEnviando(false);
    }
  }, [visible]);

  const iniciarEdicao = useCallback((comentario: Comentario) => {
    setEditando(comentario);
    setDraft(comentario.texto);
    inputRef.current?.focus();
  }, []);

  const cancelarEdicao = useCallback(() => {
    setEditando(null);
    setDraft('');
  }, []);

  const confirmarExclusao = useCallback(
    (comentario: Comentario) => {
      Alert.alert(
        'Excluir comentário',
        'Essa ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              // Se o comentário que estava sendo editado é o que foi excluído,
              // o input precisa sair do modo edição — senão o "salvar" tentaria
              // atualizar algo que não existe mais.
              if (editando?._id === comentario._id) cancelarEdicao();
              try {
                await onExcluir(comentario._id);
              } catch (err) {
                Alert.alert('Comentários', extractErrorMessage(err));
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [cancelarEdicao, editando, onExcluir],
  );

  const abrirAcoes = useCallback(
    (comentario: Comentario) => {
      Alert.alert('Comentário', undefined, [
        { text: 'Editar', onPress: () => iniciarEdicao(comentario) },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => confirmarExclusao(comentario),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    },
    [confirmarExclusao, iniciarEdicao],
  );

  const handleToggleCurtida = useCallback(
    async (comentario: Comentario) => {
      try {
        await onToggleCurtida(comentario);
      } catch (err) {
        Alert.alert('Comentários', extractErrorMessage(err));
      }
    },
    [onToggleCurtida],
  );

  const handleEnviar = useCallback(async () => {
    const texto = draft.trim();
    if (!texto || enviando) return;

    setEnviando(true);
    try {
      if (editando) {
        await onEditar(editando._id, texto);
        setEditando(null);
      } else {
        await onCriar(texto);
        // Lista é ordenada do mais novo para o mais antigo, então o comentário
        // recém-criado entra no topo — rolar até lá dá o retorno visual de que
        // ele foi publicado.
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
      setDraft('');
    } catch (err) {
      // Mantém o texto no input: forçar o usuário a redigitar depois de uma
      // falha de rede seria a pior parte da experiência.
      Alert.alert('Comentários', extractErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }, [draft, editando, enviando, onCriar, onEditar]);

  const podeEnviar = draft.trim().length > 0 && !enviando;

  const renderListaVazia = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title="Não foi possível carregar"
          subtitle={error}
        />
      );
    }
    return (
      <EmptyState
        icon="chatbubble-outline"
        title="Nenhum comentário ainda"
        subtitle="Seja o primeiro a comentar sobre esse evento."
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Edge-to-edge: no Android 15 (S24) as barras do sistema são desenhadas
      // POR CIMA do app. Sem estas duas, o modal é recortado pela barra de
      // navegação e o input fica embaixo dos botões de home/voltar.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: paddingInferior }]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              Comentários{total > 0 ? ` (${total})` : ''}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={comentarios}
            keyExtractor={(c) => c._id}
            renderItem={({ item }) => (
              <ComentarioItem
                comentario={item}
                onToggleCurtida={handleToggleCurtida}
                onAbrirAcoes={abrirAcoes}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              comentarios.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={renderListaVazia()}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  style={styles.footerLoader}
                  color={colors.primary}
                />
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void onRefresh();
                }}
                tintColor={colors.primary}
              />
            }
            onEndReached={() => {
              void onLoadMore();
            }}
            onEndReachedThreshold={0.4}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          {/* Barra de edição e input compartilham a mesma borda superior, pra
              a faixa "Editando comentário" ficar colada ao campo em vez de
              flutuar acima da divisória. */}
          <View style={styles.composer}>
            {editando ? (
              <View style={styles.editandoBar}>
                <Ionicons name="pencil" size={14} color={colors.primary} />
                <Text style={styles.editandoText} numberOfLines={1}>
                  Editando comentário
                </Text>
                <Pressable onPress={cancelarEdicao} hitSlop={8}>
                  <Text style={styles.editandoCancel}>Cancelar</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Escreva um comentário..."
                placeholderTextColor={colors.textMuted}
                value={draft}
                onChangeText={setDraft}
                maxLength={COMENTARIO_MAX_LENGTH}
                multiline
                editable={!enviando}
              />
              <Pressable
                onPress={handleEnviar}
                disabled={!podeEnviar}
                style={[styles.sendBtn, !podeEnviar && styles.sendBtnDisabled]}
                accessibilityLabel={
                  editando ? 'Salvar edição' : 'Publicar comentário'
                }
              >
                {enviando ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Ionicons
                    name={editando ? 'checkmark' : 'send'}
                    size={18}
                    color={colors.textOnPrimary}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

interface ComentarioItemProps {
  comentario: Comentario;
  onToggleCurtida: (comentario: Comentario) => void;
  onAbrirAcoes: (comentario: Comentario) => void;
}

const ComentarioItem: React.FC<ComentarioItemProps> = ({
  comentario,
  onToggleCurtida,
  onAbrirAcoes,
}) => {
  const inicial = comentario.autor.nome?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.comment}>
      {comentario.autor.avatarUrl ? (
        <Image
          source={{ uri: comentario.autor.avatarUrl }}
          style={styles.avatar}
          accessibilityLabel={`Foto de ${comentario.autor.nome}`}
          testID={CLARITY_MASK}
        />
      ) : (
        <LinearGradient
          colors={colors.gradientAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{inicial}</Text>
        </LinearGradient>
      )}

      <View style={styles.commentBody}>
        <View style={styles.commentHead}>
          <Text style={styles.autor} numberOfLines={1} testID={CLARITY_MASK}>
            {comentario.autor.nome}
          </Text>
          <Text style={styles.tempo}>
            {formatRelativeTime(comentario.criadoEm)}
            {/* O selo sai da presença de `editadoEm`, não de um boolean à
                parte — assim ele nunca contradiz a data mostrada. */}
            {comentario.editadoEm ? ' · editado' : ''}
          </Text>
        </View>

        <Text style={styles.texto}>{comentario.texto}</Text>

        {/* Só o autor vê o menu de editar/excluir. O backend também barra
            (403), então isso é conveniência de UI, não a trava de segurança. */}
        {comentario.meu ? (
          <Pressable
            onPress={() => onAbrirAcoes(comentario)}
            hitSlop={6}
            style={styles.acoesBtn}
          >
            <Text style={styles.acoesText}>Editar ou excluir</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={() => onToggleCurtida(comentario)}
        hitSlop={8}
        style={styles.curtidaBtn}
        accessibilityLabel={
          comentario.curtidoPorMim ? 'Descurtir comentário' : 'Curtir comentário'
        }
      >
        <Ionicons
          name={comentario.curtidoPorMim ? 'heart' : 'heart-outline'}
          size={18}
          color={comentario.curtidoPorMim ? colors.heart : colors.textMuted}
        />
        {/* O contador some no zero, como no Instagram — um "0" pendurado em
            todo comentário só faz ruído. */}
        {comentario.curtidas > 0 ? (
          <Text
            style={[
              styles.curtidaCount,
              comentario.curtidoPorMim && styles.curtidaCountAtiva,
            ]}
          >
            {comentario.curtidas}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm,
    // paddingBottom entra inline: depende do inset da barra de navegação e de
    // o teclado estar aberto ou não.
    height: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.title, color: colors.textPrimary },
  centered: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.lg,
  },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center' },
  footerLoader: { paddingVertical: spacing.md },
  comment: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  commentBody: { flex: 1 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  autor: { ...typography.bodyBold, color: colors.textPrimary, flexShrink: 1 },
  tempo: { ...typography.caption, color: colors.textMuted },
  texto: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  acoesBtn: { marginTop: spacing.xxs, alignSelf: 'flex-start' },
  acoesText: { ...typography.captionBold, color: colors.textMuted },
  curtidaBtn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    gap: 2,
    minWidth: 28,
  },
  curtidaCount: { ...typography.caption, color: colors.textMuted },
  curtidaCountAtiva: { color: colors.heart },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editandoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  editandoText: { ...typography.caption, color: colors.primary, flex: 1 },
  editandoCancel: { ...typography.captionBold, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
