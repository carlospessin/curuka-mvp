import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { StatusIndicator } from '../components/StatusIndicator';
import { PlanBadge } from '../components/PlanBadge';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { ScanActivity } from '../types';

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { state } = useApp();
  const { recentScans, plan } = state;
  const [filter, setFilter] = useState<'all' | 'normal' | 'unusual'>('all');

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    if (diffMins < 60) return `Há ${diffMins} min • ${timeStr}`;
    if (diffHours < 24) return `Há ${diffHours}h • ${timeStr}`;
    return `${dateStr} • ${timeStr}`;
  };

  const filteredScans = recentScans.filter(scan => {
    if (filter === 'all') return true;
    return scan.type === filter;
  });

  // Add more mock data for history
  const mockHistory: ScanActivity[] = [
    ...recentScans,
    {
      id: '4',
      childId: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      location: 'Casa',
      type: 'normal',
    },
    {
      id: '5',
      childId: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28), // 28 hours ago
      location: 'Clube Esporte',
      type: 'normal',
    },
    {
      id: '6',
      childId: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
      location: 'Parque Central',
      type: 'unusual',
    },
  ];

  const displayHistory = plan === 'free' ? mockHistory.slice(0, 3) : mockHistory;

  const renderScanItem = ({ item }: { item: ScanActivity }) => (
    <TouchableOpacity style={styles.scanItem}>
      <View style={styles.scanIcon}>
        <Ionicons
          name={item.type === 'normal' ? 'checkmark-circle' : 'warning'}
          size={22}
          color={item.type === 'normal' ? colors.status.active : colors.status.warning}
        />
      </View>
      <View style={styles.scanInfo}>
        <Text style={styles.scanLocation}>{item.location}</Text>
        <Text style={styles.scanTime}>{formatDateTime(item.timestamp)}</Text>
      </View>
      <StatusIndicator
        status={item.type === 'normal' ? 'active' : 'warning'}
        label={item.type === 'normal' ? 'Normal' : 'Atenção'}
        size="small"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>Escaneamentos recentes</Text>
        </View>
        <PlanBadge plan={plan} />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'normal', 'unusual'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todos' : f === 'normal' ? 'Normal' : 'Atenção'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History Limit Warning for Free */}
      {plan === 'free' && (
        <Card style={styles.limitCard}>
          <View style={styles.limitContent}>
            <Ionicons name="time" size={20} color={colors.status.warning} />
            <View style={styles.limitInfo}>
              <Text style={styles.limitTitle}>Histórico Limitado</Text>
              <Text style={styles.limitText}>Você está vendo apenas as últimas 24 horas</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Plans')}
          >
            <Text style={styles.upgradeText}>Fazer Upgrade</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary[600]} />
          </TouchableOpacity>
        </Card>
      )}

      {/* History List */}
      <FlatList
        data={displayHistory}
        keyExtractor={item => item.id}
        renderItem={renderScanItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.neutral.text.muted} />
            <Text style={styles.emptyText}>Nenhum escaneamento encontrado</Text>
          </View>
        }
      />

      {/* Map Preview - Only for Plus/Premium */}
      {plan !== 'free' && (
        <View style={styles.mapPreview}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={32} color={colors.primary[500]} />
            <Text style={styles.mapText}>Ver no Mapa</Text>
          </View>
        </View>
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
  limitCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: `${colors.status.warning}10`,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.warning,
  },
  limitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  limitText: {
    fontSize: 12,
    color: colors.neutral.text.secondary,
    marginTop: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  upgradeText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  scanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  scanInfo: {
    flex: 1,
  },
  scanLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral.text.primary,
  },
  scanTime: {
    fontSize: 12,
    color: colors.neutral.text.muted,
    marginTop: 2,
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
  mapPreview: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    backgroundColor: colors.neutral.card,
  },
  mapPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  mapText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
