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
import { colors, radius, spacing, typography } from '@/theme';

import { PerfilStackScreenProps } from '@/navigation/types';

type Props = PerfilStackScreenProps<'EditarPerfil'>;

/**
 * Tela de edição do perfil. O endpoint ainda não existe no backend,
 * então o botão de salvar está bloqueado (mostra "Em breve").
 * Quando o backend expor PUT /auth/me, basta trocar o alert por uma chamada
 * real e o refreshUser do AuthContext.
 */
export const EditarPerfilScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const handleSave = () => {
    Alert.alert(
      'Em breve',
      'A edição de perfil será liberada em uma próxima versão.',
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

          <Text style={styles.title}>Editar perfil</Text>

          <View style={styles.badge}>
            <Ionicons name="information-circle" size={16} color={colors.info} />
            <Text style={styles.badgeText}>Funcionalidade em breve</Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="person-outline"
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
            />
            <Input
              icon="mail-outline"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Button
              label="Salvar alterações"
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
