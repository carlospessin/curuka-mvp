import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, spacing } from '../theme/colors';

export function LandingScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary[700]} />
            <Text style={styles.badgeText}>Protecao infantil conectada</Text>
          </View>

          <Text style={styles.brand}>Curuka</Text>
          <Text style={styles.title}>Sua landing abre primeiro. O app entra em seguida.</Text>
          <Text style={styles.subtitle}>
            Cadastre a crianca, conecte a tag NFC e receba alertas quando alguem escanear o perfil.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.primaryButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, styles.featureIconGreen]}>
              <Ionicons name="people" size={20} color={colors.primary[700]} />
            </View>
            <Text style={styles.featureTitle}>Perfil seguro</Text>
            <Text style={styles.featureText}>
              Nome, contatos principais e dados medicos acessiveis no link publico da crianca.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, styles.featureIconBlue]}>
              <Ionicons name="radio" size={20} color={colors.secondary[700]} />
            </View>
            <Text style={styles.featureTitle}>Tag NFC</Text>
            <Text style={styles.featureText}>
              Grave a URL completa do perfil na tag e compartilhe um acesso rapido em emergencias.
            </Text>
          </View>

          <View style={styles.featureCardWide}>
            <Text style={styles.featureTitle}>Fluxo esperado</Text>
            <View style={styles.steps}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Abre a landing</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Clica em Entrar</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Vai para o login do app</Text>
              </View>
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
    backgroundColor: '#f4f8f4',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: colors.neutral.card,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#dce7dd',
    ...shadows.large,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '700',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary[700],
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#17321d',
    maxWidth: 720,
  },
  subtitle: {
    marginTop: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    color: colors.neutral.text.secondary,
    maxWidth: 680,
  },
  heroActions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.neutral.white,
    fontSize: 15,
    fontWeight: '800',
  },
  grid: {
    gap: spacing.md,
  },
  featureCard: {
    backgroundColor: colors.neutral.card,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    ...shadows.medium,
  },
  featureCardWide: {
    backgroundColor: '#17321d',
    borderRadius: 24,
    padding: spacing.lg,
    ...shadows.medium,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureIconGreen: {
    backgroundColor: colors.primary[100],
  },
  featureIconBlue: {
    backgroundColor: colors.secondary[100],
  },
  featureTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.neutral.text.primary,
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.neutral.text.secondary,
  },
  steps: {
    marginTop: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: colors.primary[500],
    color: colors.neutral.white,
    fontWeight: '800',
    paddingTop: 4,
  },
  stepText: {
    color: colors.neutral.white,
    fontSize: 15,
    fontWeight: '700',
  },
  stepLine: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginLeft: 13,
    marginVertical: 6,
  },
});
