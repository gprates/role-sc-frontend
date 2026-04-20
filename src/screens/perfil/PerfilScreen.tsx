import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import { APP_VERSION, MUNICIPIOS_FIXOS, STORAGE_KEYS } from '@/utils/constants';
import { storage } from '@/utils/storage';

import { PerfilStackScreenProps } from '@/navigation/types';

type Props = PerfilStackScreenProps<'PerfilHome'>;

interface NotificationSettings {
  push: boolean;
  municipios: Record<string, boolean>;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  push: true,
  municipios: MUNICIPIOS_FIXOS.reduce<Record<string, boolean>>(
    (acc, m) => ({ ...acc, [m]: true }),
    {},
  ),
};

export const PerfilScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATIONS,
  );

  useEffect(() => {
    const load = async () => {
      const stored = await storage.get<NotificationSettings>(
        STORAGE_KEYS.notificacoes,
      );
      if (stored) setNotifications(stored);
    };
    void load();
  }, []);

  const updateNotifications = useCallback(
    async (next: NotificationSettings) => {
      setNotifications(next);
      await storage.set(STORAGE_KEYS.notificacoes, next);
    },
    [],
  );

  const togglePush = () => {
    void updateNotifications({ ...notifications, push: !notifications.push });
  };

  const toggleMunicipio = (municipio: string) => {
    void updateNotifications({
      ...notifications,
      municipios: {
        ...notifications.municipios,
        [municipio]: !notifications.municipios[municipio],
      },
    });
  };

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Meu Perfil</Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={colors.gradientAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarBg}
            >
              <Text style={styles.avatarText}>{inicial}</Text>
            </LinearGradient>
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.nome ?? 'Visitante'}</Text>
          <Text style={styles.userEmail}>
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

        <Text style={styles.sectionLabel}>CONFIGURAÇÕES</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.itemIconWrap}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>Notificações push</Text>
              <Text style={styles.itemSubtitle}>
                Receba avisos sobre novos eventos
              </Text>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={togglePush}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.notifyLabel}>NOTIFICAR POR MUNICÍPIO</Text>
          {MUNICIPIOS_FIXOS.map((m, index) => (
            <View key={m}>
              <View style={styles.switchRow}>
                <Text style={[styles.itemLabel, { flex: 1 }]}>{m}</Text>
                <Switch
                  value={notifications.municipios[m] ?? false}
                  onValueChange={() => toggleMunicipio(m)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  disabled={!notifications.push}
                />
              </View>
              {index < MUNICIPIOS_FIXOS.length - 1 ? (
                <View style={styles.subDivider} />
              ) : null}
            </View>
          ))}
        </View>

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
  itemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  subDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 0,
    opacity: 0.5,
  },
  notifyLabel: {
    ...typography.micro,
    color: colors.textMuted,
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
  },

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
