import React from 'react';
import { useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore: vector-icons types sometimes missing
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { useApp } from '../context/AppContext';
import { getChildBySlug } from '../services/pessoa-service.js';
import { getAuth } from 'firebase/auth';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

export function ChildProfileScreen() {
  const { state, emergencyMode, toggleEmergencyMode } = useApp();
  const { plan } = state;
  const route = useRoute<any>();
  const requestedId: string | undefined = route.params?.childId;
  const requestedSlug: string | undefined = route.params?.slug;

  const [resolvedChild, setResolvedChild] = React.useState<import('../types').Child | null>(null);

  // attempt to resolve the child either from the context or by slug lookup
  React.useEffect(() => {
    if (requestedId) {
      // id takes precedence, nothing to fetch
      return;
    }

    if (requestedSlug) {
      // try to find in already‑loaded children first
      const found = state.children.find((c) => c.slug === requestedSlug);
      if (found) {
        setResolvedChild(found);
        return;
      }

      // fall back to querying Firestore directly
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (uid) {
        getChildBySlug(uid, requestedSlug)
          .then((c) => {
            if (c) setResolvedChild(c);
          })
          .catch((err) => console.error('error fetching child by slug', err));
      }
    }
  }, [requestedId, requestedSlug, state.children]);

  const child =
    resolvedChild ||
    state.children.find((c) => c.id === requestedId) ||
    state.children[0] ||
    { name: '', age: 0, tagStatus: 'inactive', guardians: [], medicalInfo: {} };

  const handleEmergencyMode = () => {
    Alert.alert(
      emergencyMode ? 'Desativar Modo Emergência' : 'Ativar Modo Emergência',
      emergencyMode
        ? 'O modo emergência será desativado.'
        : 'Todos os responsáveis serão notificados e os dados médicos serão exibidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: emergencyMode ? 'Desativar' : 'Ativar',
          style: emergencyMode ? 'default' : 'destructive',
          onPress: toggleEmergencyMode,
        },
      ]
    );
  };

  const handleBlockTag = () => {
    Alert.alert(
      'Bloquear Tag',
      'Deseja bloquear a tag da criança? Isso impedirá novas leituras até que seja desbloqueada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () => { },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Perfil da Criança</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.neutral.white} />
          </View>
          <Text style={styles.name}>{child.name}</Text>
          <Text style={styles.age}>{child.age} anos</Text>
          <View style={styles.statusContainer}>
            <StatusIndicator
              status={child.tagStatus === 'active' ? 'active' : 'blocked'}
              label={child.tagStatus === 'active' ? 'Tag Ativa' : 'Tag Bloqueada'}
              size="large"
            />
          </View>
        </View>

        {/* Tag Info */}
        <Card title="Informações da Tag">
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="radio-button-on" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID da Tag</Text>
              <Text style={styles.infoValue}>CUK-2024-MAR-001</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="qr-code" size={20} color={colors.secondary[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>NFC + QR Code</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={20} color={colors.status.active} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Última Leitura</Text>
              <Text style={styles.infoValue}>Hoje, 14:32</Text>
            </View>
          </View>
        </Card>

        {/* Medical Info - Premium Only */}
        <Card
          title="Dados Médicos"
          subtitle={plan !== 'premium' ? 'Disponível no Premium' : 'Informações de emergência'}
          locked={plan !== 'premium'}
        >
          {plan === 'premium' && child.medicalInfo && (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="water" size={20} color={colors.status.alert} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tipo Sanguíneo</Text>
                  <Text style={styles.infoValue}>{child.medicalInfo.bloodType}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="warning" size={20} color={colors.status.warning} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Alergias</Text>
                  <Text style={styles.infoValue}>{child.medicalInfo.allergies?.join(', ') || 'Nenhuma'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="medical" size={20} color={colors.secondary[500]} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contato de Emergência</Text>
                  <Text style={styles.infoValue}>{child.medicalInfo.emergencyContact}</Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={emergencyMode ? 'Desativar Emergência' : 'Modo Emergência'}
            onPress={handleEmergencyMode}
            variant={emergencyMode ? 'success' : 'danger'}
            size="large"
            style={styles.emergencyButton}
          />

          {plan !== 'free' && (
            <Button
              title="Bloquear Tag"
              onPress={handleBlockTag}
              variant="outline"
              size="large"
              style={styles.blockButton}
            />
          )}
        </View>

        {/* Emergency Mode Active */}
        {emergencyMode && (
          <View style={styles.emergencyBanner}>
            <Ionicons name="alert" size={24} color={colors.neutral.white} />
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyTitle}>MODO EMERGÊNCIA ATIVO</Text>
              <Text style={styles.emergencyText}>Todos os responsáveis foram notificados</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.neutral.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  age: {
    fontSize: 14,
    color: colors.neutral.text.secondary,
    marginTop: 4,
  },
  statusContainer: {
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral.text.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral.text.primary,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emergencyButton: {
    marginBottom: spacing.sm,
  },
  blockButton: {
    marginBottom: spacing.sm,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.alert,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  emergencyText: {
    fontSize: 12,
    color: colors.neutral.white,
    opacity: 0.9,
    marginTop: 2,
  },
});
