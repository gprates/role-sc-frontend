import React, { useEffect, useMemo, useState } from 'react';
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

import { Button } from '@/components/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { colors, radius, spacing, typography } from '@/theme';

// Faixa Unicode dos acentos combinantes (0x0300-0x036f), usada para tirar
// acento na busca. Construída via charCode em vez de escape \u no regex
// literal para não depender de como o editor grava a sequência de escape.
const COMBINING_MARKS_RE = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g',
);

const normalize = (v: string): string =>
  v.normalize('NFD').replace(COMBINING_MARKS_RE, '').toLowerCase().trim();

interface FilterSelectModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: readonly string[];
  selected: string[];
  onApply: (values: string[]) => void;
  searchPlaceholder?: string;
}

/**
 * Modal de seleção múltipla com busca (debounced) — usado pelos filtros de
 * município e categoria. Mantém uma seleção "rascunho" própria: só grava no
 * filtro de verdade quando o usuário toca em Aplicar.
 */
export const FilterSelectModal: React.FC<FilterSelectModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selected,
  onApply,
  searchPlaceholder = 'Buscar...',
}) => {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(selected);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setSearch('');
    }
  }, [visible, selected]);

  const filteredOptions = useMemo(() => {
    const query = normalize(debouncedSearch);
    if (!query) return options;
    return options.filter((o) => normalize(o).includes(query));
  }, [options, debouncedSearch]);

  const toggleOption = (item: string) => {
    setDraft((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item],
    );
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = draft.includes(item);
              return (
                <Pressable style={styles.option} onPress={() => toggleOption(item)}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                    {item}
                  </Text>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? colors.primary : colors.border}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhum resultado para &quot;{debouncedSearch}&quot;
              </Text>
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footerRow}>
            <Button
              label="Limpar"
              variant="secondary"
              onPress={() => setDraft([])}
              fullWidth={false}
              style={styles.footerButton}
              disabled={draft.length === 0}
            />
            <Button
              label={draft.length > 0 ? `Aplicar (${draft.length})` : 'Aplicar'}
              variant="primary"
              onPress={handleApply}
              fullWidth={false}
              style={styles.footerButton}
            />
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
    paddingBottom: spacing.lg,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: { ...typography.body, color: colors.textPrimary },
  optionLabelActive: { ...typography.bodyBold, color: colors.primary },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: { flex: 1 },
});
