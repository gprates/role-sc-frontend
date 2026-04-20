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
import { colors, radius, spacing, typography } from '@/theme';

import { PerfilStackScreenProps } from '@/navigation/types';

type Props = PerfilStackScreenProps<'AlterarSenha'>;

/**
 * Tela de alteração de senha. O endpoint ainda não existe no backend,
 * então o botão mostra "Em breve" ao ser pressionado.
 */
export const AlterarSenhaScreen: React.FC<Props> = ({ navigation }) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleSave = () => {
    Alert.alert(
      'Em breve',
      'A alteração de senha será liberada em uma próxima versão.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backRow}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <Text style={styles.title}>Alterar senha</Text>

          <View style={styles.badge}>
            <Ionicons name="information-circle" size={16} color={colors.info} />
            <Text style={styles.badgeText}>Funcionalidade em breve</Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="lock-closed-outline"
              placeholder="Senha atual"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              isPassword
            />
            <Input
              icon="lock-closed-outline"
              placeholder="Nova senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              isPassword
            />
            <Input
              icon="lock-closed-outline"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              isPassword
            />

            <Button
              label="Salvar"
              onPress={handleSave}
              style={{ marginTop: spacing.sm }}
              disabled
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
  title: { ...typography.display, color: colors.textPrimary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { ...typography.captionBold, color: colors.info },
  form: { gap: spacing.md, marginTop: spacing.md },
});
