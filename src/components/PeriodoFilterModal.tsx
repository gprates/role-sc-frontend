import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/theme';
import {
  DateRange,
  QUICK_RANGE_OPTIONS,
  formatFullDate,
  isSameDay,
} from '@/utils/dateRange';

interface PeriodoFilterModalProps {
  visible: boolean;
  onClose: () => void;
  dataInicio: Date | null;
  dataFim: Date | null;
  onApply: (dataInicio: Date | null, dataFim: Date | null) => void;
}

/**
 * Modal de filtro por período: atalhos rápidos (esta semana, próxima semana,
 * próximo mês) ou seleção manual via date-picker nativo do Android. Mantém
 * um rascunho próprio de from/to — só grava no filtro de verdade em Aplicar.
 */
export const PeriodoFilterModal: React.FC<PeriodoFilterModalProps> = ({
  visible,
  onClose,
  dataInicio,
  dataFim,
  onApply,
}) => {
  const [from, setFrom] = useState<Date | null>(dataInicio);
  const [to, setTo] = useState<Date | null>(dataFim);

  useEffect(() => {
    if (visible) {
      setFrom(dataInicio);
      setTo(dataFim);
    }
  }, [visible, dataInicio, dataFim]);

  const activeQuickKey = QUICK_RANGE_OPTIONS.find((opt) => {
    const range = opt.getRange();
    return isSameDay(from, range.from) && isSameDay(to, range.to);
  })?.key;

  const handleQuickSelect = (getRange: () => DateRange) => {
    const range = getRange();
    setFrom(range.from);
    setTo(range.to);
  };

  const openPicker = (target: 'from' | 'to') => {
    DateTimePickerAndroid.open({
      value: (target === 'from' ? from : to) ?? new Date(),
      mode: 'date',
      minimumDate: target === 'to' ? (from ?? undefined) : undefined,
      maximumDate: target === 'from' ? (to ?? undefined) : undefined,
      onChange: (event, selected) => {
        if (event.type !== 'set' || !selected) return;
        if (target === 'from') {
          setFrom(selected);
          setTo((prevTo) => (prevTo && selected > prevTo ? selected : prevTo));
        } else {
          setTo(selected);
          setFrom((prevFrom) => (prevFrom && selected < prevFrom ? selected : prevFrom));
        }
      },
    });
  };

  const handleApply = () => {
    onApply(from, to);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Período</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>ATALHOS</Text>
          <View style={styles.quickRow}>
            {QUICK_RANGE_OPTIONS.map((opt) => {
              const active = activeQuickKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleQuickSelect(opt.getRange)}
                  style={[styles.quickChip, active && styles.quickChipActive]}
                >
                  <Text style={[styles.quickChipLabel, active && styles.quickChipLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>OU ESCOLHA AS DATAS</Text>
          <View style={styles.datesRow}>
            <Pressable style={styles.dateField} onPress={() => openPicker('from')}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dateFieldLabel}>{from ? formatFullDate(from) : 'De'}</Text>
            </Pressable>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <Pressable style={styles.dateField} onPress={() => openPicker('to')}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dateFieldLabel}>{to ? formatFullDate(to) : 'Até'}</Text>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Button
              label="Limpar"
              variant="secondary"
              onPress={() => {
                setFrom(null);
                setTo(null);
              }}
              fullWidth={false}
              style={styles.footerButton}
              disabled={!from && !to}
            />
            <Button
              label="Aplicar"
              variant="primary"
              onPress={handleApply}
              fullWidth={false}
              style={styles.footerButton}
            />
          </View>
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
    paddingBottom: spacing.lg,
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
  sectionLabel: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBackground,
  },
  quickChipActive: { backgroundColor: colors.chipActiveBackground },
  quickChipLabel: { ...typography.captionBold, color: colors.chipText },
  quickChipLabelActive: { color: colors.chipActiveText },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateFieldLabel: { ...typography.body, color: colors.textPrimary },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: { flex: 1 },
});
