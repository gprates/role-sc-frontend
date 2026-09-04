import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoriaBadge } from '@/components/CategoriaBadge';
import { EventoCover } from '@/components/EventoCover';
import { useComentarios } from '@/hooks/useComentarios';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { eventoService } from '@/services/evento.service';
import { extractErrorMessage } from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme';
import { Evento } from '@/types';
import { formatLongDate, formatShortDate } from '@/utils/format';

import { HomeStackScreenProps } from '@/navigation/types';

import { ComentariosModal } from './ComentariosModal';

type Props = HomeStackScreenProps<'DetalheEvento'>;

export const DetalheEventoScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id, abrirComentarios } = route.params;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Já nasce aberto quando a navegação veio do ícone de comentário do card.
  const [comentariosOpen, setComentariosOpen] = useState(
    abrirComentarios === true,
  );

  const { isFavorito, toggle } = useFavoritos();

  // Montado aqui, e não dentro do modal, porque o contador da barra de ações
  // precisa do total mesmo com o modal fechado.
  const comentarios = useComentarios(id);

  const loadEvento = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventoService.getById(id);
      setEvento(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEvento();
  }, [loadEvento]);

  const handleShare = async () => {
    if (!evento) return;
    try {
      // Montado por partes e filtrado: eventos sem descrição deixavam duas
      // linhas em branco no meio da mensagem quando isso era um template só.
      const linhas = [
        evento.titulo,
        evento.descricao,
        `Veja mais: ${evento.url}`,
        'Compartilhado pelo app Rolê SC',
      ].filter(Boolean);

      await Share.share({
        message: linhas.join('\n\n'),
        title: evento.titulo,
      });
    } catch (err) {
      console.warn('[DetalheEvento.share] falhou', err);
    }
  };

  const openOriginalUrl = async () => {
    if (!evento?.url) return;
    try {
      await WebBrowser.openBrowserAsync(evento.url);
    } catch (err) {
      Alert.alert('Erro', extractErrorMessage(err));
    }
  };

  const handleToggleFavorito = async () => {
    if (!evento) return;
    await toggle(evento);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !evento) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Evento não encontrado'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const favorito = isFavorito(evento._id);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrapper}>
          <EventoCover
            imageUrl={evento.imageUrl}
            categoria={evento.categoria}
            height={260}
          />
          <SafeAreaView style={styles.heroOverlay} edges={['top']}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.tagRow}>
            {evento.categoria ? (
              <CategoriaBadge categoria={evento.categoria} />
            ) : null}
            <View style={styles.municipioChip}>
              <Text style={styles.municipioText}>{evento.municipio}</Text>
            </View>
          </View>

          <Text style={styles.title}>{evento.titulo}</Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              label="INÍCIO"
              value={formatLongDate(evento.dataInicio)}
            />
            {evento.dataFim ? (
              <>
                <View style={styles.infoDivider} />
                <InfoRow
                  icon="calendar-outline"
                  label="TÉRMINO"
                  value={formatLongDate(evento.dataFim)}
                />
              </>
            ) : null}
            {evento.horario ? (
              <>
                <View style={styles.infoDivider} />
                <InfoRow
                  icon="time-outline"
                  label="HORÁRIO"
                  value={evento.horario}
                />
              </>
            ) : null}
            {evento.local ? (
              <>
                <View style={styles.infoDivider} />
                <InfoRow
                  icon="location-outline"
                  label="LOCAL"
                  value={evento.local}
                />
              </>
            ) : null}
          </View>

          {evento.descricao ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre o evento</Text>
              <Text style={styles.description}>{evento.descricao}</Text>
            </View>
          ) : null}

          <Pressable onPress={openOriginalUrl} style={styles.sourceRow}>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={styles.sourceText}>Ver publicação original</Text>
          </Pressable>

          <Text style={styles.footerTimestamp}>
            Publicado em {formatShortDate(evento.processedAt)}
          </Text>
        </View>
      </ScrollView>

      <ActionBar
        comentarios={comentarios.total}
        favorito={favorito}
        onToggleFavorito={handleToggleFavorito}
        onShare={handleShare}
        onOpenComentarios={() => setComentariosOpen(true)}
      />

      <ComentariosModal
        visible={comentariosOpen}
        onClose={() => setComentariosOpen(false)}
        comentarios={comentarios.comentarios}
        loading={comentarios.loading}
        refreshing={comentarios.refreshing}
        loadingMore={comentarios.loadingMore}
        error={comentarios.error}
        total={comentarios.total}
        onRefresh={comentarios.refresh}
        onLoadMore={comentarios.loadMore}
        onCriar={comentarios.criar}
        onEditar={comentarios.editar}
        onExcluir={comentarios.excluir}
        onToggleCurtida={comentarios.toggleCurtida}
      />
    </View>
  );
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <View style={infoRowStyles.row}>
    <View style={infoRowStyles.iconWrap}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  </View>
);

interface ActionBarProps {
  comentarios: number;
  favorito: boolean;
  onToggleFavorito: () => void;
  onShare: () => void;
  onOpenComentarios: () => void;
}

/**
 * Barra fixa do rodapé: favoritar, comentar, compartilhar — nessa ordem.
 *
 * O coração é o MESMO gesto do coração do EventoCard na Home (favoritar), com
 * o mesmo ícone e a mesma cor. Antes o detalhe usava um marcador de página pra
 * favoritar e o coração pra uma curtida mockada, o que dava dois símbolos
 * diferentes pra ideia de "salvar" e um botão que não fazia nada.
 */
const ActionBar: React.FC<ActionBarProps> = ({
  comentarios,
  favorito,
  onToggleFavorito,
  onShare,
  onOpenComentarios,
}) => {
  return (
    <SafeAreaView style={actionStyles.safe} edges={['bottom']}>
      <View style={actionStyles.bar}>
        <Pressable
          onPress={onToggleFavorito}
          style={actionStyles.item}
          accessibilityLabel={
            favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
          }
        >
          <Ionicons
            name={favorito ? 'heart' : 'heart-outline'}
            size={22}
            color={favorito ? colors.heart : colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={onOpenComentarios}
          style={actionStyles.item}
          accessibilityLabel="Ver comentários"
        >
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={colors.textSecondary}
          />
          <Text style={actionStyles.count}>{comentarios}</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          style={actionStyles.item}
          accessibilityLabel="Compartilhar evento"
        >
          <Ionicons
            name="share-social-outline"
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  goBackBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  goBackText: { ...typography.bodyBold, color: colors.primary },
  scrollContent: { paddingBottom: 120 },
  heroWrapper: { position: 'relative' },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  tagRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  municipioChip: {
    backgroundColor: colors.chipBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  municipioText: {
    ...typography.bodyBold,
    color: colors.chipText,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sourceText: { ...typography.bodyBold, color: colors.primary },
  footerTimestamp: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.micro, color: colors.textMuted },
  value: { ...typography.bodyBold, color: colors.textPrimary, marginTop: 2 },
});

const actionStyles = StyleSheet.create({
  safe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    // O tab bar já é escondido nesta tela (ver `esconderTabBarNoDetalhe` no
    // AppNavigator), mas ele tem `elevation: 8` — se algum dia voltar a ser
    // renderizado aqui, sem isto ele cobriria a barra inteira de novo, que é
    // exatamente o bug que deixava o botão de comentários inalcançável.
    elevation: 12,
    zIndex: 12,
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  count: { ...typography.caption, color: colors.textSecondary },
});
