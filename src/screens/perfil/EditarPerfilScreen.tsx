import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/services/api';
import { authService } from '@/services/auth.service';
import { colors, radius, spacing, typography } from '@/theme';

import { PerfilStackScreenProps } from '@/navigation/types';

type Props = PerfilStackScreenProps<'EditarPerfil'>;

const NOME_MIN_LENGTH = 2;
const NOME_MAX_LENGTH = 80;

/**
 * Edição de perfil do usuário logado. Hoje só permite trocar o **nome** —
 * email é exibido apenas como leitura (decisão de produto, ver
 * CONTRATO_EDITAR_PERFIL.md). Quando o backend suportar alteração de email
 * (com novo fluxo de verificação), adicionar aqui.
 */
export const EditarPerfilScreen: React.FC<Props> = ({ navigation }) => {
  const { user, patchUser } = useAuth();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [submitting, setSubmitting] = useState(false);

  const trimmedNome = nome.trim();
  const nomeAtual = user?.nome ?? '';
  const houveAlteracao = trimmedNome !== nomeAtual;
  const nomeValido =
    trimmedNome.length >= NOME_MIN_LENGTH &&
    trimmedNome.length <= NOME_MAX_LENGTH;

  const handleSave = async () => {
    if (!nomeValido) {
      Alert.alert(
        'Nome inválido',
        `O nome deve ter entre ${NOME_MIN_LENGTH} e ${NOME_MAX_LENGTH} caracteres.`,
      );
      return;
    }
    if (!houveAlteracao) {
      navigation.goBack();
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.updateProfile(trimmedNome);
      await patchUser(res.user);
      Alert.alert('Perfil atualizado', 'Suas informações foram salvas.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backRow}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Editar perfil</Text>
            <Text style={styles.subtitle}>
              Atualize seu nome de exibição. Para alterar a foto, volte ao
              perfil e toque no avatar.
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.fieldLabel}>NOME</Text>
              <Input
                icon="person-outline"
                placeholder="Nome completo"
                autoCapitalize="words"
                value={nome}
                onChangeText={setNome}
                maxLength={NOME_MAX_LENGTH}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                autoFocus
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={styles.readOnlyField}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.readOnlyIcon}
                />
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {user?.email ?? '—'}
                </Text>
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.fieldHelp}>
                O email não pode ser alterado.
              </Text>
            </View>

            <Button
              label={houveAlteracao ? 'Salvar alterações' : 'Voltar'}
              onPress={handleSave}
              loading={submitting}
              disabled={!nomeValido}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.textSecondary },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: { gap: spacing.md, marginTop: spacing.md },
  fieldLabel: {
    ...typography.micro,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyIcon: { marginRight: spacing.sm },
  readOnlyText: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  fieldHelp: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: spacing.md,
  },
});
