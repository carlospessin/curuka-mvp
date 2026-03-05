import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { PlanBadge } from '../components/PlanBadge';
import { useApp } from '../context/AppContext';
import { markChildEventsAsRead, watchChildEvents } from '../services/pessoa-service.js';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { AppNotification } from '../types';

export function HistoryScreen() {
  const { state } = useApp();
  const { plan, children } = state;
  const [filter, setFilter] = useState<'all' | 'scan' | 'location'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

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

  const openMapForNotification = async (item: AppNotification) => {
    if (item.type !== 'location') return;
    if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return;

    const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('cannot-open-map');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel abrir o mapa para essa localizacao.');
    }
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const iconName = item.type === 'scan' ? 'scan-outline' : 'location-outline';
    const iconColor = item.type === 'scan' ? colors.primary[600] : colors.secondary[600];
    const hour = item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const childName =
      (item.childId && children.find((child) => child.id === item.childId)?.name) ||
      item.childName ||
      'Crianca';
    const defaultMessage =
      item.type === 'scan'
        ? `A tag de ${childName} foi escaneada as ${hour}.`
        : `Localizacao de ${childName} enviada as ${hour}.`;

    return (
      <TouchableOpacity style={styles.notificationItem} onPress={() => openMapForNotification(item)} activeOpacity={item.type === 'location' ? 0.75 : 1}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationText}>{item.message || defaultMessage}</Text>
          {item.location ? <Text style={styles.notificationMeta}>Local: {item.location}</Text> : null}
          <Text style={styles.notificationMeta}>{formatDateTime(item.timestamp)}</Text>
          {item.type === 'location' ? <Text style={styles.mapHint}>Toque para abrir no mapa</Text> : null}
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Historico</Text>
          <Text style={styles.subtitle}>Notificacoes de tag e localizacao</Text>
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
              {item === 'all' ? 'Todos' : item === 'scan' ? 'Escaneamento' : 'Localizacao'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.emptyText}>Carregando notificacoes...</Text>
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
              <Text style={styles.emptyText}>Nenhuma notificacao encontrada</Text>
            </View>
          }
        />
      )}
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
    marginBottom: spacing.md,
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
});
