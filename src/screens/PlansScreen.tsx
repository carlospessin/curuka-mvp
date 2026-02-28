import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PlanBadge } from '../components/PlanBadge';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { PlanType, PLAN_NAMES, PLAN_PRICES } from '../types';

interface PlanFeature {
  name: string;
  included: boolean;
  locked?: boolean;
}

const planFeatures: Record<PlanType, PlanFeature[]> = {
  free: [
    { name: '1 Criança', included: true },
    { name: '1 Responsável', included: true },
    { name: 'Notificação de escaneamento', included: true },
    { name: 'Última leitura', included: true },
    { name: 'Botão "Ligar agora"', included: true },
    { name: 'Histórico 24h', included: true },
    { name: 'Mapa de localização', included: false, locked: true },
    { name: 'Alertas inteligentes', included: false, locked: true },
    { name: 'Modo emergência avançado', included: false, locked: true },
  ],
  plus: [
    { name: '1 Criança', included: true },
    { name: 'Até 5 Responsáveis', included: true },
    { name: 'Histórico completo', included: true },
    { name: 'Mapa aproximado', included: true },
    { name: 'Bloqueio remoto da tag', included: true },
    { name: 'SMS limitado', included: true },
    { name: 'Exportação de histórico', included: true },
    { name: 'Alertas inteligentes', included: false, locked: true },
    { name: 'Dados médicos', included: false, locked: true },
  ],
  premium: [
    { name: 'Múltiplas crianças', included: true },
    { name: 'Responsáveis ilimitados', included: true },
    { name: 'Alertas fora do padrão', included: true },
    { name: 'Score de proteção dinâmico', included: true },
    { name: 'Modo emergência avançado', included: true },
    { name: 'Dados médicos completos', included: true },
    { name: 'Relatório mensal', included: true },
    { name: 'SMS ilimitado', included: true },
    { name: 'Backup criptografado', included: true },
    { name: 'Compartilhamento temporário', included: true },
    { name: 'Notificação prioritária', included: true },
  ],
};

export function PlansScreen() {
  const { state, setPlan } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(state.plan);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === state.plan) return;
    setLoading(true);
    setTimeout(() => {
      setPlan(plan);
      setLoading(false);
    }, 1000);
  };

  const getPlanColor = (plan: PlanType) => {
    switch (plan) {
      case 'free':
        return colors.plan.free;
      case 'plus':
        return colors.plan.plus;
      case 'premium':
        return colors.plan.premium;
    }
  };

  const getPlanBackground = (plan: PlanType) => {
    switch (plan) {
      case 'free':
        return colors.neutral.border;
      case 'plus':
        return colors.secondary[50];
      case 'premium':
        return '#FFF8E1';
    }
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
          <Text style={styles.title}>Escolha seu Plano</Text>
          <Text style={styles.subtitle}>Proteção completa para sua família</Text>
        </View>

        {/* Plans */}
        {(['free', 'plus', 'premium'] as const).map(plan => (
          <TouchableOpacity
            key={plan}
            style={[
              styles.planCard,
              selectedPlan === plan && styles.planCardSelected,
              state.plan === plan && styles.planCardCurrent,
            ]}
            onPress={() => handleSelectPlan(plan)}
            disabled={state.plan === plan || loading}
          >
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <View style={[styles.planIcon, { backgroundColor: getPlanBackground(plan) }]}>
                  <Text style={[styles.planIconText, { color: getPlanColor(plan) }]}>
                    {plan === 'free' ? '○' : plan === 'plus' ? '◆' : '👑'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.planName}>{PLAN_NAMES[plan]}</Text>
                  <Text style={styles.planPrice}>
                    {plan === 'free' ? 'Grátis' : `R$ ${PLAN_PRICES[plan].toFixed(2).replace('.', ',')}/mês`}
                  </Text>
                </View>
              </View>
              {state.plan === plan && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Plano Atual</Text>
                </View>
              )}
            </View>

            <View style={styles.featuresList}>
              {planFeatures[plan].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  {feature.included ? (
                    <Ionicons name="checkmark-circle" size={18} color={colors.status.active} />
                  ) : (
                    <Ionicons name="lock-closed" size={18} color={colors.neutral.text.muted} />
                  )}
                  <Text
                    style={[
                      styles.featureText,
                      !feature.included && styles.featureTextLocked,
                    ]}
                  >
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>

            {state.plan !== plan && (
              <Button
                title={loading ? 'Processando...' : plan === 'free' ? 'Selecionar' : 'Assinar Agora'}
                onPress={() => handleSelectPlan(plan)}
                variant={plan === 'premium' ? 'primary' : 'secondary'}
                loading={loading}
                style={styles.planButton}
              />
            )}
          </TouchableOpacity>
        ))}

        {/* Comparison */}
        <View style={styles.comparison}>
          <Text style={styles.comparisonTitle}>Por que fazer upgrade?</Text>
          <View style={styles.comparisonItem}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary[500]} />
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonName}>Maior Proteção</Text>
              <Text style={styles.comparisonDesc}>Score de proteção aumenta com mais recursos</Text>
            </View>
          </View>
          <View style={styles.comparisonItem}>
            <Ionicons name="notifications" size={24} color={colors.secondary[500]} />
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonName}>Alertas Inteligentes</Text>
              <Text style={styles.comparisonDesc}>Detectamos leituras fora do padrão</Text>
            </View>
          </View>
          <View style={styles.comparisonItem}>
            <Ionicons name="medkit" size={24} color={colors.status.alert} />
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonName}>Emergência Completa</Text>
              <Text style={styles.comparisonDesc}>Dados médicos disponíveis em situações críticas</Text>
            </View>
          </View>
        </View>
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
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral.text.secondary,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.medium,
  },
  planCardSelected: {
    borderColor: colors.primary[500],
  },
  planCardCurrent: {
    borderColor: colors.status.active,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  planIconText: {
    fontSize: 20,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  planPrice: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: colors.status.active,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  featuresList: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: colors.neutral.text.primary,
  },
  featureTextLocked: {
    color: colors.neutral.text.muted,
  },
  planButton: {
    marginTop: spacing.sm,
  },
  comparison: {
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.text.primary,
    marginBottom: spacing.md,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  comparisonInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  comparisonName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral.text.primary,
  },
  comparisonDesc: {
    fontSize: 12,
    color: colors.neutral.text.secondary,
    marginTop: 2,
  },
});
