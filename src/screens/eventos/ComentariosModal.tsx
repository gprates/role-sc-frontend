import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';

interface Comentario {
  id: string;
  autor: string;
  texto: string;
  tempo: string;
}

// Lista mockada — endpoint ainda não existe no backend.
const MOCK_COMENTARIOS: Comentario[] = [
  {
    id: '1',
    autor: 'Ana Beatriz',
    texto: 'Alguém vai? Adoraria companhia!',
    tempo: 'há 2h',
  },
  {
    id: '2',
    autor: 'Rafael Costa',
    texto: 'Esse ano promete ser incrível. Vou com a família.',
    tempo: 'há 5h',
  },
  {
    id: '3',
    autor: 'Julia',
    texto: 'Tem estacionamento no local?',
    tempo: 'há 1d',
  },
];

interface ComentariosModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet simples de comentários. Endpoint ainda não existe no backend,
 * então usa dados mockados e o input do rascunho fica desabilitado
 * (mensagem "Em breve"). Quando o backend expor POST /eventos/:id/comentarios,
 * trocar para um hook useComentarios.
 */
export const ComentariosModal: React.FC<ComentariosModalProps> = ({
  visible,
  onClose,
}) => {
  const [draft, setDraft] = useState('');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Comentários</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            data={MOCK_COMENTARIOS}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <View style={styles.comment}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.autor[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentHead}>
                    <Text style={styles.autor}>{item.autor}</Text>
                    <Text style={styles.tempo}>{item.tempo}</Text>
                  </View>
                  <Text style={styles.texto}>{item.texto}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Em breve..."
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              editable={false}
            />
            <View style={[styles.sendBtn, { opacity: 0.4 }]}>
              <Ionicons name="send" size={18} color={colors.textOnPrimary} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: spacing.md,
    maxHeight: '80%',
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
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  commentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autor: { ...typography.bodyBold, color: colors.textPrimary },
  tempo: { ...typography.caption, color: colors.textMuted },
  texto: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
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
});
