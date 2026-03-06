import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { deleteCurrentUserAccount, updateCurrentUserDisplayName } from '../services/auth-service';

export function ProfileScreen({ navigation }: { navigation: any }) {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [name, setName] = React.useState(currentUser?.displayName || '');
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmVisible, setConfirmVisible] = React.useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCurrentUserDisplayName(name);
      Alert.alert('Sucesso', 'Nome atualizado com sucesso.');
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar o nome.';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      setConfirmVisible(false);
      await deleteCurrentUserAccount();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel excluir a conta.';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.neutral.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Meu Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          placeholderTextColor={colors.neutral.text.muted}
          style={styles.input}
          editable={!saving && !deleting}
        />

        <Text style={styles.metaLabel}>Email</Text>
        <Text style={styles.metaValue}>{currentUser?.email || 'Nao informado'}</Text>

        <TouchableOpacity
          style={[styles.primaryButton, (saving || deleting) && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Salvar nome</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, (saving || deleting) && styles.disabledButton]}
          onPress={() => setConfirmVisible(true)}
          disabled={saving || deleting}
        >
          {deleting ? (
            <ActivityIndicator color={colors.status.alert} />
          ) : (
            <Text style={styles.dangerButtonText}>Excluir conta</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={confirmVisible} onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar exclusao</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir sua conta? Essa acao nao pode ser desfeita.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDangerButton} onPress={handleDeleteAccount}>
                <Text style={styles.modalDangerText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  card: {
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
  },
  label: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.neutral.white,
    color: colors.neutral.text.primary,
    fontSize: 15,
  },
  metaLabel: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginTop: spacing.md,
  },
  metaValue: {
    fontSize: 14,
    color: colors.neutral.text.primary,
    marginTop: spacing.xs,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.neutral.white,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.alert,
    backgroundColor: colors.neutral.white,
  },
  dangerButtonText: {
    color: colors.status.alert,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  modalText: {
    marginTop: spacing.sm,
    color: colors.neutral.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalSecondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  modalSecondaryText: {
    color: colors.neutral.text.secondary,
    fontWeight: '600',
  },
  modalDangerButton: {
    backgroundColor: colors.status.alert,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  modalDangerText: {
    color: colors.neutral.white,
    fontWeight: '700',
  },
});
