import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { PlanBadge } from '../components/PlanBadge';
import { useApp } from '../context/AppContext';
import {
  deleteAllChildEvents,
  deleteChildEvent,
  deleteChildEvents,
  markChildEventsAsRead,
  watchChildEvents,
} from '../services/pessoa-service.js';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { AppNotification } from '../types';
import { Footer } from '../components/Footer';

export function HistoryScreen() {
  const { state } = useApp();
  const { plan, children } = state;
  const [filter, setFilter] = useState<'all' | 'scan' | 'location'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    let unsubEvents: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubEvents) {
        unsubEvents();
        unsubEvents = null;
      }

      if (!user?.uid) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubEvents = watchChildEvents(
        user.uid,
        (events: AppNotification[]) => {
          setNotifications(events);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubAuth();
      if (unsubEvents) unsubEvents();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      markChildEventsAsRead(uid).catch((err) => console.error('failed to mark child events as read', err));
    }, [])
  );

  const formatDateTime = (date: Date) => {
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${day} as ${time}`;
  };

  const filteredNotifications = useMemo(() => {
    const ordered = [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (filter === 'all') return ordered;
    return ordered.filter((item) => item.type === filter);
  }, [notifications, filter]);

  React.useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => notifications.some((item) => item.id === id)));
  }, [notifications]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelection = (notificationId: string) => {
    setSelectedIds((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId]
    );
  };

  const openMapForNotification = async (item: AppNotification) => {
    if (selectionMode || item.type !== 'location') return;
    if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return;

    const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('cannot-open-map');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel abrir o mapa para essa localização.');
    }
  };

  const confirmDeleteOne = (item: AppNotification) => {
    Alert.alert(
      'Excluir notificação',
      'Essa notificação sera removida permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteChildEvent(item.id);
            } catch {
              Alert.alert('Erro', 'Nao foi possivel excluir a notificação.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const confirmDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      'Excluir selecionadas',
      `Excluir ${selectedIds.length} notificação${selectedIds.length > 1 ? 'oes' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteChildEvents(selectedIds);
              exitSelectionMode();
            } catch {
              Alert.alert('Erro', 'Nao foi possivel excluir as notificações selecionadas.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const confirmDeleteAll = () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid || notifications.length === 0) return;

    Alert.alert(
      'Excluir todas',
      'Todas as notificações do historico serao removidas permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAllChildEvents(uid);
              exitSelectionMode();
            } catch {
              Alert.alert('Erro', 'Nao foi possivel excluir todas as notificações.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const iconName = item.type === 'scan' ? 'scan-outline' : 'location-outline';
    const iconColor = item.type === 'scan' ? colors.primary[600] : colors.secondary[600];
    const hour = item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const childName =
      (item.childId && children.find((child) => child.id === item.childId)?.name) ||
      item.childName ||
      'Criança';
    const defaultMessage =
      item.type === 'scan'
        ? `A tag de ${childName} foi escaneada as ${hour}.`
        : `Localização de ${childName} enviada as ${hour}.`;
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isSelected && styles.notificationItemSelected]}
        onPress={() => (selectionMode ? toggleSelection(item.id) : openMapForNotification(item))}
        activeOpacity={0.75}
      >
        {selectionMode ? (
          <TouchableOpacity
            style={styles.selectionToggle}
            onPress={() => toggleSelection(item.id)}
            hitSlop={8}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={22}
              color={isSelected ? colors.primary[600] : colors.neutral.text.muted}
            />
          </TouchableOpacity>
        ) : null}

        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={styles.notificationInfo}>
          <Text style={styles.notificationText}>{item.message || defaultMessage}</Text>
          {item.location ? <Text style={styles.notificationMeta}>Local: {item.location}</Text> : null}
          <Text style={styles.notificationMeta}>{formatDateTime(item.timestamp)}</Text>
          {item.type === 'location' && !selectionMode ? (
            <Text style={styles.mapHint}>Toque para abrir no mapa</Text>
          ) : null}
        </View>

        <View style={styles.notificationActions}>
          {!item.read && <View style={styles.unreadDot} />}
          {!selectionMode ? (
            <TouchableOpacity
              onPress={() => confirmDeleteOne(item)}
              style={styles.deleteIconButton}
              hitSlop={8}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={18} color={colors.status.alert} />
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Historico</Text>
          <Text style={styles.subtitle}>Notificações de tag e localização</Text>
        </View>
        <PlanBadge plan={plan} />
      </View>

      <View style={styles.filters}>
        {(['all', 'scan', 'location'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterButton, filter === item && styles.filterActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === 'all' ? 'Todos' : item === 'scan' ? 'Escaneamento' : 'Localização'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsBar}>
        {selectionMode ? (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={exitSelectionMode} disabled={deleting}>
              <Ionicons name="close-circle-outline" size={16} color={colors.neutral.text.secondary} />
              <Text style={styles.actionText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, selectedIds.length === 0 && styles.actionButtonDisabled]}
              onPress={confirmDeleteSelected}
              disabled={selectedIds.length === 0 || deleting}
            >
              <Ionicons name="trash-outline" size={16} color={colors.status.alert} />
              <Text style={[styles.actionText, styles.actionDanger]}>
                Excluir selecionadas ({selectedIds.length})
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, filteredNotifications.length === 0 && styles.actionButtonDisabled]}
              onPress={() => setSelectionMode(true)}
              disabled={filteredNotifications.length === 0 || deleting}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary[600]} />
              <Text style={styles.actionText}>Selecionar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, notifications.length === 0 && styles.actionButtonDisabled]}
              onPress={confirmDeleteAll}
              disabled={notifications.length === 0 || deleting}
            >
              <Ionicons name="trash-bin-outline" size={16} color={colors.status.alert} />
              <Text style={[styles.actionText, styles.actionDanger]}>Excluir todas</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading || deleting ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.emptyText}>{loading ? 'Carregando notificações...' : 'Atualizando historico...'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={46} color={colors.neutral.text.muted} />
              <Text style={styles.emptyText}>Nenhuma notificação encontrada</Text>
            </View>
          }
        />
      )}

      <View style={styles.customFooter}>
        <Footer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral.text.secondary,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral.card,
    marginRight: spacing.sm,
  },
  filterActive: {
    backgroundColor: colors.primary[500],
  },
  filterText: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.neutral.white,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral.text.secondary,
  },
  actionDanger: {
    color: colors.status.alert,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  notificationItemSelected: {
    borderWidth: 1,
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  selectionToggle: {
    marginRight: spacing.sm,
    paddingTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  notificationMeta: {
    fontSize: 12,
    color: colors.neutral.text.muted,
    marginTop: 3,
  },
  mapHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.secondary[700],
    fontWeight: '600',
  },
  notificationActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    minHeight: 40,
  },
  deleteIconButton: {
    padding: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.alert,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.neutral.text.muted,
    marginTop: spacing.md,
  },
  customFooter: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
