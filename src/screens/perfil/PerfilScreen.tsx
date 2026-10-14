import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { colors, radius, spacing, typography } from '@/theme';
import { CLARITY_MASK } from '@/utils/clarity';
import { APP_VERSION } from '@/utils/constants';

import { PerfilStackScreenProps } from '@/navigation/types';

type Props = PerfilStackScreenProps<'PerfilHome'>;

export const PerfilScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { uploading, promptPickAndUpload } = useAvatarUpload();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const inicial = user?.nome?.[0]?.toUpperCase() ?? '?';
  const avatarUrl = user?.avatarUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Meu Perfil</Text>

        <View style={styles.avatarSection}>
          <Pressable
            onPress={promptPickAndUpload}
            disabled={uploading}
            style={styles.avatarWrap}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarBg}
                accessibilityLabel="Foto de perfil"
                testID={CLARITY_MASK}
              />
            ) : (
              <LinearGradient
                colors={colors.gradientAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarBg}
              >
                <Text style={styles.avatarText}>{inicial}</Text>
              </LinearGradient>
            )}

            {uploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.textOnPrimary} />
              </View>
            ) : null}

            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
            </View>
          </Pressable>
          <Text style={styles.userName} testID={CLARITY_MASK}>
            {user?.nome ?? 'Visitante'}
          </Text>
          <Text style={styles.userEmail} testID={CLARITY_MASK}>
            {user?.email ?? 'visitante@rolesc.app'}
          </Text>

          <Pressable
            onPress={() => navigation.navigate('EditarPerfil')}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>CONTA</Text>
        <Pressable
          onPress={() => navigation.navigate('AlterarSenha')}
          style={styles.listItem}
        >
          <View style={styles.itemIconWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={styles.itemLabel}>Alterar senha</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>

        <Text style={styles.version}>Rolê SC · versão {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  pageTitle: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    position: 'relative',
  },
  avatarBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  avatarOverlay: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: 46,
    fontWeight: '700',
  },
  cameraBtn: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  userName: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  userEmail: { ...typography.body, color: colors.textMuted },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chipBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  editBtnText: { ...typography.bodyBold, color: colors.primary },

  sectionLabel: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutText: { ...typography.bodyBold, color: colors.danger },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
