import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore: icon types sometimes missing
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { PlanBadge } from '../components/PlanBadge';
import { useApp } from '../context/AppContext';
import { logout } from '../services/auth-service';
import { getAuth } from 'firebase/auth';
import { saveUserSettings } from '../services/pessoa-service.js';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

export function SettingsScreen() {
  const { state, setUserSettings } = useApp();
  const notifications = state.notificationsEnabled;
  const smsAlerts = state.smsAlertsEnabled;

  const handleExportHistory = () => {
    if (state.plan === 'free') {
      Alert.alert('Recurso Premium', 'Exporte seu histórico completo com o plano Plus ou Premium.');
      return;
    }
    Alert.alert('Exportar', 'Histórico exportado com sucesso!');
  };

  const handleAddGuardian = () => {
    if (state.guardians >= state.maxGuardians) {
      Alert.alert(
        'Limite Atingido',
        `Seu plano permite até ${state.maxGuardians} responsáveis. Faça upgrade para adicionar mais.`
      );
      return;
    }
    Alert.alert('Adicionar Responsável', 'Funcionalidade em desenvolvimento.');
  };

  const handleBackup = () => {
    if (state.plan !== 'premium') {
      Alert.alert('Recurso Premium', 'Backup criptografado disponível apenas no plano Premium.');
      return;
    }
    Alert.alert('Backup', 'Backup realizado com sucesso!');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel sair da conta.');
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
          <Text style={styles.title}>Configurações</Text>
          <PlanBadge plan={state.plan} />
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <Card>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="person-outline" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Meu Perfil</Text>
              <Text style={styles.settingValue}>Editar informações</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleAddGuardian}>
            <View style={styles.settingIcon}>
              <Ionicons name="people-outline" size={20} color={colors.secondary[500]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Responsáveis</Text>
              <Text style={styles.settingValue}>
                {state.guardians}/{state.maxGuardians} cadastrados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>
        </Card>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notificações</Text>
        <Card>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={20} color={colors.status.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingValue}>Alertas de escaneamento</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={async (value) => {
                setUserSettings({ notificationsEnabled: value });
                try {
                  const auth = getAuth();
                  const user = auth.currentUser;
                  if (user?.uid) {
                    await saveUserSettings(user.uid, { notificationsEnabled: value });
                  }
                } catch (err) {
                  console.error('failed to save user settings', err);
                }
              }}
              trackColor={{ false: colors.neutral.border, true: colors.primary[300] }}
              thumbColor={notifications ? colors.primary[500] : colors.neutral.text.muted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.status.active} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Alertas SMS</Text>
              <Text style={styles.settingValue}>
                {state.plan === 'free' ? 'Indisponível no Free' : state.plan === 'plus' ? 'Limitado' : 'Ilimitado'}
              </Text>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={async (value) => {
                setUserSettings({ smsAlertsEnabled: value });
                try {
                  const auth = getAuth();
                  const user = auth.currentUser;
                  if (user?.uid) {
                    await saveUserSettings(user.uid, { smsAlertsEnabled: value });
                  }
                } catch (err) {
                  console.error('failed to save user settings', err);
                }
              }}
              trackColor={{ false: colors.neutral.border, true: colors.primary[300] }}
              thumbColor={smsAlerts ? colors.primary[500] : colors.neutral.text.muted}
              disabled={state.plan === 'free'}
            />
          </View>
        </Card>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Dados</Text>
        <Card>
          <TouchableOpacity style={styles.settingItem} onPress={handleExportHistory}>
            <View style={styles.settingIcon}>
              <Ionicons name="download-outline" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Exportar Histórico</Text>
              <Text style={styles.settingValue}>
                {state.plan === 'free' ? '🔒 Disponível no Plus' : 'Baixar CSV'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleBackup}>
            <View style={styles.settingIcon}>
              <Ionicons name="cloud-outline" size={20} color={colors.secondary[500]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Backup Seguro</Text>
              <Text style={styles.settingValue}>
                {state.plan === 'premium' ? 'Backup criptografado' : '🔒 Disponível no Premium'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>
        </Card>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Suporte</Text>
        <Card>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle-outline" size={20} color={colors.neutral.text.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Central de Ajuda</Text>
              <Text style={styles.settingValue}>FAQ e tutoriais</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.neutral.text.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Contato</Text>
              <Text style={styles.settingValue}>suporte@curuka.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text-outline" size={20} color={colors.neutral.text.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Termos e Privacidade</Text>
              <Text style={styles.settingValue}>Políticas do app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingIcon}>
              <Ionicons name="log-out-outline" size={20} color={colors.status.alert} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Sair da Conta</Text>
              <Text style={styles.settingValue}>Encerrar sessao atual</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>curuka Safe</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral.text.primary,
  },
  settingValue: {
    fontSize: 12,
    color: colors.neutral.text.muted,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  appVersion: {
    fontSize: 12,
    color: colors.neutral.text.muted,
    marginTop: 4,
  },
});
