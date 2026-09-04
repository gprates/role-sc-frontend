import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventoStatus } from '@/types';

interface StatusOption {
  value: EventoStatus | undefined;
  label: string;
}

// `undefined` = "Todos" (sem filtro de status no backend).
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'ativos', label: 'Por vir' },
  { value: 'passados', label: 'Já aconteceram' },
  { value: undefined, label: 'Todos' },
];

interface StatusFilterModalProps {
  visible: boolean;
  onClose: () => void;
  value: EventoStatus | undefined;
  onApply: (value: EventoStatus | undefined) => void;
}

/**
 * Bottom sheet de seleção única (Por vir / Já aconteceram / Todos). Diferente
 * dos demais filtros, aplica direto ao tocar na opção — não precisa de botão
 * "Aplicar" porque só existe uma escolha possível de cada vez.
 */
export const StatusFilterModal: React.FC<StatusFilterModalProps> = ({
  visible,
  onClose,
  value,
  onApply,
}) => {
  const handleSelect = (next: EventoStatus | undefined) => {
    onApply(next);
    onClose();
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Edge-to-edge (obrigatório no Android 15+): sem estas duas o sheet é
      // recortado pela barra de navegação do sistema.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Eventos</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {STATUS_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.label}
                style={styles.option}
                onPress={() => handleSelect(opt.value)}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? colors.primary : colors.border}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm,
    // paddingBottom entra inline: depende do inset da barra de navegação.
    paddingHorizontal: spacing.xl,
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
    paddingBottom: spacing.sm,
  },
  title: { ...typography.title, color: colors.textPrimary },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: { ...typography.body, color: colors.textPrimary },
  optionLabelActive: { ...typography.bodyBold, color: colors.primary },
});
