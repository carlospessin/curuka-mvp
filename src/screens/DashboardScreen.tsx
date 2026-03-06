import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { ProtectionScoreCircle } from '../components/ProtectionScoreCircle';
import { PlanBadge } from '../components/PlanBadge';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, shadows, radius } from '../theme/colors';
import { getAuth } from 'firebase/auth';
import type { Child } from '../types';
import { removeChildProfile, saveChildProfile, setChildTagStatus, watchChildrenList } from '../services/pessoa-service.js';
import { Platform } from 'react-native';
import ShieldIcon from '../components/ShieldIcon';
import StatusPulse from '../components/StatusPulse';
import { Footer } from '../components/Footer';


type ChildMedicalInfo = {
  pcd?: boolean;
  healthPlans?: string;
  otherInfo?: string;
};

type ChildProfile = Child & {
  ownerId: string;
  medicalInfo?: ChildMedicalInfo;
};

type ChildFormData = {
  photo: string;
  name: string;
  age: string;
  guardians: {
    name: string;
    phone: string;
    whatsapp: boolean;
    principal: boolean;
  }[];
  pcd: boolean;
  healthPlans: string;
  otherInfo: string;
};

type NfcWriteStatus =
  | {
    type: 'success' | 'error';
    message: string;
  }
  | null;

const PUBLIC_WEB_BASE_URL = (process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://curuka-mvp.vercel.app').replace(/\/+$/, '');

const createEmptyGuardian = () => ({
  name: '',
  phone: '',
  whatsapp: true,
  principal: true,
});

const EMPTY_CHILD_FORM: ChildFormData = {
  photo: '',
  name: '',
  age: '',
  guardians: [createEmptyGuardian()],
  pcd: false,
  healthPlans: '',
  otherInfo: '',
};

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { state, unreadNotifications } = useApp();
  const { children, notifications, protectionScore, plan } = state;
  // If the context still contains a legacy sample child we ignore it by
  // treating an empty array as "no profile". `fallbackChild` is only used
  // when there really is at least one child stored locally, which shouldn't
  // happen in production now that initial children starts empty.
  const fallbackChild = children.length > 0 ? children[0] : null;
  const latestNotification = useMemo(() => {
    if (!notifications || notifications.length === 0) return null;
    return [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }, [notifications]);

  const auth = getAuth();
  const user = auth.currentUser;
  const [userName, setUserName] = useState(user?.displayName?.split(' ')[0] || 'Responsavel');

  const [remoteChildren, setRemoteChildren] = useState<ChildProfile[]>([]);
  const [loadingChild, setLoadingChild] = useState(true);
  const [savingChild, setSavingChild] = useState(false);
  const [childModalVisible, setChildModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [medicalInfoExpanded, setMedicalInfoExpanded] = useState(false);
  const [formData, setFormData] = useState<ChildFormData>(EMPTY_CHILD_FORM);
  const [nfcModalVisible, setNfcModalVisible] = useState(false);
  const [nfcTargetChild, setNfcTargetChild] = useState<ChildProfile | null>(null);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcEnabled, setNfcEnabled] = useState<boolean | null>(null);
  const [checkingNfc, setCheckingNfc] = useState(false);
  const [writingNfc, setWritingNfc] = useState(false);
  const [nfcWriteStatus, setNfcWriteStatus] = useState<NfcWriteStatus>(null);

  const canEditMedicalInfo = plan === 'plus' || plan === 'premium';
  const canAddMoreGuardians = plan === 'plus' || plan === 'premium';

  const childrenList: ChildProfile[] =
    remoteChildren.length > 0
      ? remoteChildren
      : fallbackChild
        ? [
          {
            ...fallbackChild,
            ownerId: user?.uid || 'local',
            slug: (fallbackChild.slug as string) || undefined,
            medicalInfo: {
              pcd: false,
              healthPlans: '',
              otherInfo: '',
            },
          } as ChildProfile,
        ]
        : [];

  const hasChildProfile = childrenList.length > 0;

  const child = useMemo(() => {
    // for convenience we still expose the first child when only one is
    // needed (eg. toggling tag status)
    return childrenList[0] || null;
  }, [childrenList]);

  // dynamic values for protection card: number of children (tags) and guardians
  const guardianCount = child && Array.isArray(child.guardians) ? child.guardians.length : 0;

  // compute number of tags (children) available. for premium plans the
  // context array should already hold all profiles; otherwise fall back
  // to the remote watcher data. this ensures the counter increments as
  // new kids are added.
  const tagCount = childrenList.length > 0 ? childrenList.length : children.length;
  const tagMax = tagCount || 1; // prevent zero in denominator/visual styles

  const dynamicFactors = [
    {
      name: 'Tags cadastradas',
      value: tagCount,
      max: tagMax,
    },
    {
      name: 'Responsáveis',
      value: guardianCount,
      max: state.maxGuardians,
      locked: false,
    },
  ];

  useEffect(() => {
    if (!user?.uid) {
      setLoadingChild(false);
      return;
    }
    // subscribe to entire list; updates will replace the array automatically
    const unsubscribe = watchChildrenList(
      user.uid,
      (profiles: ChildProfile[]) => {
        setRemoteChildren(profiles);
        setLoadingChild(false);
      },
      () => {
        setLoadingChild(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  useFocusEffect(
    React.useCallback(() => {
      const nextName = getAuth().currentUser?.displayName?.split(' ')[0] || 'Responsavel';
      setUserName(nextName);
    }, [])
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Ha ${diffMins} min`;
    if (diffHours < 24) return `Ha ${diffHours}h`;
    return `Ha ${diffDays} dias`;
  };

  const handleUpgrade = () => {
    navigation.navigate('Plans');
  };

  const buildChildProfileLink = (profile: ChildProfile | null) => {
    if (!profile?.slug) return null;

    return `${PUBLIC_WEB_BASE_URL}/${profile.slug}`;
  };

  const checkNfcStatus = async () => {
    if (Platform.OS === 'web') {
      setNfcSupported(false);
      setNfcEnabled(false);
      return { supported: false, enabled: false };
    }

    setCheckingNfc(true);
    try {
      const { default: NfcManager } = await import('react-native-nfc-manager');
      await NfcManager.start();

      const supported = await NfcManager.isSupported();
      let enabled = false;

      if (supported) {
        enabled = await NfcManager.isEnabled();
      }

      setNfcSupported(supported);
      setNfcEnabled(enabled);
      return { supported, enabled };
    } catch {
      setNfcSupported(false);
      setNfcEnabled(false);
      return { supported: false, enabled: false };
    } finally {
      setCheckingNfc(false);
    }
  };

  const openNfcModal = async (profile: ChildProfile) => {
    setNfcTargetChild(profile);
    setNfcWriteStatus(null);
    setNfcModalVisible(true);
    await checkNfcStatus();
  };

  const closeNfcModal = () => {
    if (writingNfc) return;
    setNfcModalVisible(false);
    setNfcWriteStatus(null);
  };

  const openNfcSettings = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('NFC indisponivel', 'A gravação NFC funciona apenas no app para celular.');
      return;
    }

    try {
      const { default: NfcManager } = await import('react-native-nfc-manager');
      if (Platform.OS === 'android') {
        await NfcManager.goToNfcSetting();
      } else {
        Alert.alert('Ative o NFC', 'No iPhone, va em Ajustes e habilite o NFC.');
      }
    } catch {
      Alert.alert('Erro', 'Nao foi possivel abrir as configurações de NFC.');
    }
  };

  const writeChildLinkToNfc = async () => {
    if (!nfcTargetChild) return;

    const link = buildChildProfileLink(nfcTargetChild);
    if (!link) {
      const msg = 'Este perfil ainda não possui link público para gravação NFC.';
      setNfcWriteStatus({ type: 'error', message: msg });
      Alert.alert('Nao foi possivel gravar', msg);
      return;
    }

    const status = await checkNfcStatus();
    if (!status.supported) {
      const msg = 'Este celular não oferece suporte a NFC.';
      setNfcWriteStatus({ type: 'error', message: msg });
      Alert.alert('NFC indisponivel', msg);
      return;
    }

    if (!status.enabled) {
      const msg = 'Ative o NFC do celular antes de gravar a tag.';
      setNfcWriteStatus({ type: 'error', message: msg });
      Alert.alert('NFC desativado', msg);
      return;
    }

    setWritingNfc(true);
    setNfcWriteStatus(null);

    let NfcManagerRef: any;
    try {
      const { default: NfcManager, Ndef, NfcTech } = await import('react-native-nfc-manager');
      NfcManagerRef = NfcManager;

      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Aproxime a tag NFC para gravar o perfil da criança.',
      });

      const bytes = Ndef.encodeMessage([Ndef.uriRecord(link)]);
      if (!bytes || bytes.length === 0) {
        throw new Error('Falha ao codificar os dados do link.');
      }

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      const successMessage = 'Tag NFC gravada com sucesso!';
      setNfcWriteStatus({ type: 'success', message: successMessage });
      Alert.alert('Sucesso', `${successMessage}`);
    } catch (err: any) {
      const rawMessage = String(err?.message || '').toLowerCase();
      const isUserCancel = rawMessage.includes('cancel') || rawMessage.includes('cancelled');
      const message = isUserCancel
        ? 'Gravação cancelada.'
        : `Falha ao gravar NFC. ${err?.message || ''}`.trim();
      setNfcWriteStatus({ type: 'error', message });
      if (!isUserCancel) {
        Alert.alert('Erro ao gravar', message);
      }
    } finally {
      try {
        await NfcManagerRef?.cancelTechnologyRequest();
      } catch {
        // keep silent: request may already be closed
      }
      setWritingNfc(false);
    }
  };

  const openCreateModal = () => {
    setEditingChildId(null);
    setFormData(EMPTY_CHILD_FORM);
    setMedicalInfoExpanded(false);
    setChildModalVisible(true);
  };

  const openEditModal = (profile: ChildProfile) => {
    const rawGuardians =
      Array.isArray(profile.guardians) && profile.guardians.length > 0
        ? profile.guardians
        : [createEmptyGuardian()];
    const hasPrincipal = rawGuardians.some((guardian) => Boolean((guardian as any)?.principal));

    setEditingChildId(profile.id);
    setFormData({
      photo: profile.photo || '',
      name: profile.name || '',
      age: profile.age ? String(profile.age) : '',
      guardians: rawGuardians.map((guardian, index) => ({
        name: guardian?.name || '',
        phone: guardian?.phone || '',
        whatsapp: Boolean(guardian?.whatsapp),
        principal: hasPrincipal ? Boolean((guardian as any)?.principal) : index === 0,
      })),
      pcd: Boolean(profile.medicalInfo?.pcd),
      healthPlans: profile.medicalInfo?.healthPlans || '',
      otherInfo: profile.medicalInfo?.otherInfo || '',
    });
    setMedicalInfoExpanded(true);
    setChildModalVisible(true);
  };


  const handleSaveChildProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe o nome da criança.');
      return;
    }

    const parsedAge = Number(formData.age);
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      Alert.alert('Campo invalido', 'Informe uma idade valida.');
      return;
    }

    const normalizedGuardians = formData.guardians
      .map((guardian) => ({
        name: guardian.name.trim(),
        phone: guardian.phone.trim(),
        whatsapp: guardian.whatsapp,
        principal: Boolean(guardian.principal),
      }))
      .filter((guardian) => guardian.name || guardian.phone);

    if (normalizedGuardians.length === 0 || !normalizedGuardians[0].name || !normalizedGuardians[0].phone) {
      Alert.alert('Campo obrigatorio', 'Informe ao menos um responsavel com telefone.');
      return;
    }

    const selectedPrincipalIndex = normalizedGuardians.findIndex((guardian) => guardian.principal);
    const guardiansWithPrincipal = normalizedGuardians.map((guardian) => ({ ...guardian, principal: false }));
    if (guardiansWithPrincipal.length === 1) {
      guardiansWithPrincipal[0].principal = true;
    } else if (selectedPrincipalIndex >= 0) {
      guardiansWithPrincipal[selectedPrincipalIndex].principal = true;
    } else {
      guardiansWithPrincipal[0].principal = true;
    }

    const payload = {
      name: formData.name.trim(),
      age: parsedAge,
      photo: formData.photo.trim() || null,
      publicProfile: true,
      tagStatus: child?.tagStatus || 'inactive',
      guardians: canAddMoreGuardians
        ? guardiansWithPrincipal
        : [{ ...guardiansWithPrincipal[0], principal: true }],
      medicalInfo: canEditMedicalInfo
        ? {
          pcd: formData.pcd,
          healthPlans: formData.healthPlans.trim(),
          otherInfo: formData.otherInfo.trim(),
        }
        : {
          pcd: false,
          healthPlans: '',
          otherInfo: '',
        },
    };

    setSavingChild(true);

    try {
      const docId = await saveChildProfile(user.uid, payload, editingChildId || undefined);
      // the watcher will pick up the new/updated document automatically,
      // but we make a defensive update in case the subscription lags.
      setRemoteChildren((prev) => {
        const updated = prev.filter((c) => c.id !== docId);
        return [...updated, { id: docId, ownerId: user.uid, ...payload }];
      });

      Alert.alert('Sucesso', `Dados da criança gravados com sucesso (${docId}).`);
      setChildModalVisible(false);
      setFormData(EMPTY_CHILD_FORM);
      setEditingChildId(null);
    } catch (err: any) {
      console.error("failed saving child in DashboardScreen", err);
      Alert.alert(
        'Erro',
        `Nao foi possivel gravar os dados da criança. ${err?.message || ''}`
      );
    } finally {
      setSavingChild(false);
    }
  };

  const deleteChildProfile = (childId?: string) => {
    if (!childId) {
      Alert.alert('Sem cadastro', 'Nao ha perfil da criança para excluir.');
      return;
    }

    setEditingChildId(childId);
    setConfirmDeleteVisible(true);
  };

  const toggleTagStatus = async (childId?: string, currentStatus?: string) => {
    if (!childId) {
      Alert.alert('Sem cadastro', 'Cadastre a criança antes de ativar ou desativar a tag.');
      return;
    }

    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      await setChildTagStatus(childId, nextStatus);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atualizar o status da tag.');
    }
  };

  const childFormSheet = (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>{editingChildId ? 'Editar Criança' : 'Cadastrar Criança'}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>Foto (URL)</Text>
          <TextInput
            value={formData.photo}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, photo: value }))}
            placeholder="https://..."
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput
            value={formData.name}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            placeholder="Nome da criança"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Idade</Text>
          <TextInput
            value={formData.age}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, age: value }))}
            placeholder="Ex: 7"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Responsáveis</Text>
          {!canAddMoreGuardians && (
            <Text style={styles.lockedHint}>Mais responsáveis? Disponível no Plus/Premium</Text>
          )}

          {formData.guardians.map((guardian, index) => (
            <View key={`guardian-${index}`} style={styles.guardianCard}>
              <View style={styles.guardianHeader}>
                <Text style={styles.guardianTitle}>Responsável {index + 1}</Text>
                {canAddMoreGuardians && index > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        guardians: prev.guardians
                          .filter((_, guardianIndex) => guardianIndex !== index)
                          .map((item, newIndex, arr) => {
                            if (arr.length === 1) {
                              return { ...item, principal: true };
                            }
                            const hasPrincipal = arr.some((g) => g.principal);
                            if (!hasPrincipal && newIndex === 0) {
                              return { ...item, principal: true };
                            }
                            return item;
                          }),
                      }))
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.status.alert} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.inputLabel}>Responsável</Text>
              <TextInput
                value={guardian.name}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    guardians: prev.guardians.map((item, guardianIndex) =>
                      guardianIndex === index ? { ...item, name: value } : item
                    ),
                  }))
                }
                placeholder="Nome do responsável"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                value={guardian.phone}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    guardians: prev.guardians.map((item, guardianIndex) =>
                      guardianIndex === index ? { ...item, phone: value } : item
                    ),
                  }))
                }
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>WhatsApp</Text>
              <View style={styles.pcdButtons}>
                <TouchableOpacity
                  style={[styles.optionButton, guardian.whatsapp && styles.optionButtonActive]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      guardians: prev.guardians.map((item, guardianIndex) =>
                        guardianIndex === index ? { ...item, whatsapp: true } : item
                      ),
                    }))
                  }
                >
                  <Text style={[styles.optionButtonText, guardian.whatsapp && styles.optionButtonTextActive]}>
                    Sim
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, !guardian.whatsapp && styles.optionButtonActive]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      guardians: prev.guardians.map((item, guardianIndex) =>
                        guardianIndex === index ? { ...item, whatsapp: false } : item
                      ),
                    }))
                  }
                >
                  <Text style={[styles.optionButtonText, !guardian.whatsapp && styles.optionButtonTextActive]}>
                    Não
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Contato principal</Text>
              <View style={styles.pcdButtons}>
                <TouchableOpacity
                  style={[styles.optionButton, guardian.principal && styles.optionButtonActive]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      guardians: prev.guardians.map((item, guardianIndex) => ({
                        ...item,
                        principal: guardianIndex === index,
                      })),
                    }))
                  }
                >
                  <Text style={[styles.optionButtonText, guardian.principal && styles.optionButtonTextActive]}>
                    Sim
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, !guardian.principal && styles.optionButtonActive]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      guardians: prev.guardians.map((item, guardianIndex) => {
                        if (guardianIndex === index && prev.guardians.length > 1) {
                          return { ...item, principal: false };
                        }
                        if (prev.guardians.length === 1) {
                          return { ...item, principal: true };
                        }
                        return item;
                      }),
                    }))
                  }
                >
                  <Text style={[styles.optionButtonText, !guardian.principal && styles.optionButtonTextActive]}>
                    Não
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {canAddMoreGuardians && (
            <TouchableOpacity
              style={styles.addGuardianButton}
              onPress={() =>
                setFormData((prev) => ({
                  ...prev,
                  guardians: [
                    ...prev.guardians.map((item, index) => ({
                      ...item,
                      principal: prev.guardians.length === 0 ? index === 0 : item.principal,
                    })),
                    { ...createEmptyGuardian(), principal: false },
                  ],
                }))
              }
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.addGuardianText}>Adicionar responsável</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.medicalHeader}
            onPress={() => setMedicalInfoExpanded((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.sectionTitle}>Informações médicas</Text>
              {!canEditMedicalInfo && <Text style={styles.lockedHint}>Disponível no Plus/Premium</Text>}
            </View>
            <Ionicons
              name={medicalInfoExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.neutral.text.secondary}
            />
          </TouchableOpacity>

          {medicalInfoExpanded && (
            <View style={!canEditMedicalInfo && styles.disabledSection}>
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>PCD</Text>
                <View style={styles.pcdButtons}>
                  <TouchableOpacity
                    style={[styles.optionButton, formData.pcd && styles.optionButtonActive]}
                    onPress={() => setFormData((prev) => ({ ...prev, pcd: true }))}
                    disabled={!canEditMedicalInfo}
                  >
                    <Text style={[styles.optionButtonText, formData.pcd && styles.optionButtonTextActive]}>Sim</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, !formData.pcd && styles.optionButtonActive]}
                    onPress={() => setFormData((prev) => ({ ...prev, pcd: false }))}
                    disabled={!canEditMedicalInfo}
                  >
                    <Text style={[styles.optionButtonText, !formData.pcd && styles.optionButtonTextActive]}>Não</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Planos de saúde</Text>
              <TextInput
                value={formData.healthPlans}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, healthPlans: value }))}
                placeholder="Unimed, Bradesco, ..."
                style={styles.input}
                editable={canEditMedicalInfo}
              />

              <Text style={styles.inputLabel}>Outras informações</Text>
              <TextInput
                value={formData.otherInfo}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, otherInfo: value }))}
                placeholder="Informações adicionais"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={canEditMedicalInfo}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            title="Cancelar"
            onPress={() => setChildModalVisible(false)}
            variant="outline"
            size="small"
            style={styles.modalButton}
          />
          <Button
            title={editingChildId ? 'Salvar' : 'Cadastrar'}
            onPress={handleSaveChildProfile}
            loading={savingChild}
            variant="primary"
            size="small"
            style={styles.modalButton}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userName}</Text>
            <Text style={styles.subtitle}>Proteção ativa para sua família</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('History')}>
            <Ionicons name="notifications-outline" size={24} color={colors.neutral.text.primary} />
            {unreadNotifications > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        {/* <Card style={styles.protectionCard}>
          <View style={styles.protectionTop}>
            <ShieldIcon size={48} color={colors.greenSoft} />
            <View style={styles.protectionTextWrap}>
              <Text style={styles.protectionTitle}>Proteção ativa</Text>
              <Text style={styles.protectionDesc}>Sistema funcionando normalmente</Text>
            </View>
          </View>



          <View style={styles.scoreFactors}>
            {dynamicFactors.map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <View style={styles.factorHeader}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  {factor.locked && <Ionicons name="lock-closed" size={10} color={colors.neutral.text.muted} />}
                </View>
                <Text style={styles.factorValue}>
                  {factor.value}/{factor.max}
                </Text>
              </View>
            ))}
          </View>
        </Card> */}

        <Card title="Crianças Cadastradas" subtitle="Gerencie os perfis das crianças">
          {loadingChild ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color={colors.primary[600]} />
              <Text style={styles.loadingText}>Carregando perfil...</Text>
            </View>
          ) : hasChildProfile ? (
            childrenList.map((c) => (
              <Card key={c.id} style={styles.childItemCard}>
                <View style={styles.childBox}>
                  <View style={styles.childTopRow}>
                    <View style={styles.childContent}>
                      <View style={styles.childAvatar}>
                        {c.photo ? (
                          <Image source={{ uri: c.photo }} style={styles.childPhoto} resizeMode="cover" />
                        ) : (
                          <Ionicons name="person" size={28} color={colors.neutral.white} />
                        )}
                      </View>
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{c.name || 'Sem cadastro'}</Text>
                        <Text style={styles.childAge}>{c.age ? `${c.age} anos` : 'Idade não informada'}</Text>
                        {c.slug && (
                          <View style={styles.slugRow}>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.nfcIconButton}
                      onPress={() => openNfcModal(c)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="wifi-outline" size={18} color={colors.secondary[700]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.childActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={async () => {
                        if (!c.slug) {
                          Alert.alert('Link indisponivel', 'Este perfil ainda não possui slug público.');
                          return;
                        }
                        const publicLink = buildChildProfileLink(c);
                        if (!publicLink) {
                          Alert.alert('Link indisponivel', 'Nao foi possivel montar o link público do perfil.');
                          return;
                        }

                        if (Platform.OS === 'web' && typeof window !== 'undefined') {
                          window.open(publicLink, '_blank', 'noopener,noreferrer');
                          return;
                        }

                        try {
                          await Linking.openURL(publicLink);
                        } catch {
                          navigation.navigate('ChildProfile', { slug: c.slug });
                        }
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color={colors.primary[600]} />
                      <Text style={styles.actionButtonText}>Ver Perfil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(c)}>
                      <Ionicons name="create-outline" size={18} color={colors.primary[600]} />
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => deleteChildProfile(c.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.status.alert} />
                      <Text style={[styles.actionButtonText, styles.dangerText]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Button
              title="Cadastrar Criança"
              onPress={openCreateModal}
              variant="outline"
              size="small"
              style={styles.createChildButton}
            />
          )}
          {plan === 'premium' && hasChildProfile && (
            <Button
              title="Cadastrar Criança"
              onPress={openCreateModal}
              variant="outline"
              size="small"
              style={[styles.createChildButton, { marginTop: spacing.sm }]}
            />
          )}
        </Card>

        <Card
          title="Ultima Atividade"
          subtitle="Notificação mais recente"
          onPress={() => navigation.navigate('History')}
        >
          {latestNotification ? (
            <View style={styles.activityContent}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={latestNotification.type === 'scan' ? 'scan-outline' : 'location-outline'}
                  size={24}
                  color={latestNotification.type === 'scan' ? colors.primary[600] : colors.secondary[600]}
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLocation}>{latestNotification.message}</Text>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityTime}>{formatTimeAgo(latestNotification.timestamp)}</Text>
                  <StatusIndicator
                    status={latestNotification.type === 'scan' ? 'active' : 'warning'}
                    label={latestNotification.type === 'scan' ? 'Escaneamento' : 'Localização'}
                    size="small"
                  />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral.text.muted} />
            </View>
          ) : (
            <View style={styles.loadingWrapper}>
              <Text style={styles.loadingText}>Nenhuma notificação recebida.</Text>
            </View>
          )}
        </Card>



        <Card style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planTitle}>Seu Plano</Text>
              <Text style={styles.planSubtitle}>Gerencie sua assinatura</Text>
            </View>
            <PlanBadge plan={plan} size="large" />
          </View>

          <Button
            title="Ver Beneficios"
            onPress={handleUpgrade}
            variant={plan === 'free' ? 'primary' : 'outline'}
            size="small"
          />
        </Card>

        {/* <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="call" size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.quickActionText}>Ligar Agora</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('History')}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[100] }]}>
              <Ionicons name="time" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={styles.quickActionText}>Historico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: plan === 'free' ? colors.neutral.border : colors.primary[100] },
              ]}
            >
              <Ionicons
                name="map"
                size={20}
                color={plan === 'free' ? colors.neutral.text.muted : colors.primary[600]}
              />
              {plan === 'free' && (
                <View style={styles.lockedIcon}>
                  <Ionicons name="lock-closed" size={10} color={colors.neutral.white} />
                </View>
              )}
            </View>
            <Text style={[styles.quickActionText, plan === 'free' && styles.lockedText]}>Mapa</Text>
          </TouchableOpacity>
        </View> */}
        <Footer />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={nfcModalVisible}
        onRequestClose={closeNfcModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.nfcModalHeader}>
              <Text style={styles.modalTitle}>Gravar NFC</Text>
              <TouchableOpacity onPress={closeNfcModal} disabled={writingNfc}>
                <Ionicons name="close" size={20} color={colors.neutral.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.nfcTargetText}>
              Perfil: <Text style={styles.nfcTargetName}>{nfcTargetChild?.name || 'Criança'}</Text>
            </Text>
            <Text style={styles.nfcLinkText}>{buildChildProfileLink(nfcTargetChild) || 'Link indisponivel'}</Text>

            <View style={styles.nfcInstructionsBox}>
              <Text style={styles.nfcInstructionsTitle}>Como usar</Text>
              <Text style={styles.nfcInstructionItem}>1. Ative o NFC no celular.</Text>
              <Text style={styles.nfcInstructionItem}>2. Toque em "Gravar NFC".</Text>
              <Text style={styles.nfcInstructionItem}>3. Encoste a tag NFC na parte traseira do aparelho.</Text>
              <Text style={styles.nfcInstructionItem}>4. Aguarde a confirmacao de sucesso.</Text>
            </View>

            <View style={styles.nfcStatusRow}>
              <Text style={styles.nfcStatusLabel}>Suporte NFC:</Text>
              <Text style={[styles.nfcStatusValue, nfcSupported ? styles.nfcOk : styles.nfcError]}>
                {checkingNfc ? 'Verificando...' : nfcSupported ? 'Disponivel' : 'Indisponivel'}
              </Text>
            </View>
            <View style={styles.nfcStatusRow}>
              <Text style={styles.nfcStatusLabel}>NFC do celular:</Text>
              <Text style={[styles.nfcStatusValue, nfcEnabled ? styles.nfcOk : styles.nfcError]}>
                {checkingNfc ? 'Verificando...' : nfcEnabled ? 'Ativo' : 'Desativado'}
              </Text>
            </View>

            {nfcWriteStatus && (
              <View
                style={[
                  styles.nfcResultBox,
                  nfcWriteStatus.type === 'success' ? styles.nfcResultSuccess : styles.nfcResultError,
                ]}
              >
                <Text
                  style={[
                    styles.nfcResultText,
                    nfcWriteStatus.type === 'success' ? styles.nfcOk : styles.nfcError,
                  ]}
                >
                  {nfcWriteStatus.message}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Fechar"
                onPress={closeNfcModal}
                variant="outline"
                size="small"
                style={styles.modalButton}
                disabled={writingNfc}
              />
              {!nfcEnabled && (
                <Button
                  title="Ativar NFC"
                  onPress={openNfcSettings}
                  variant="outline"
                  size="small"
                  style={styles.modalButton}
                />
              )}
              <Button
                title={writingNfc ? 'Gravando...' : 'Gravar NFC'}
                onPress={writeChildLinkToNfc}
                size="small"
                style={styles.modalButton}
                loading={writingNfc}
                disabled={checkingNfc || !nfcSupported || !nfcEnabled || !nfcTargetChild?.slug}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={childModalVisible}
        onRequestClose={() => setChildModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingChildId ? 'Editar Criança' : 'Cadastrar Criança'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Foto (URL)</Text>
              <TextInput
                value={formData.photo}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, photo: value }))}
                placeholder="https://..."
                style={styles.input}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                value={formData.name}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                placeholder="Nome da criança"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Idade</Text>
              <TextInput
                value={formData.age}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, age: value }))}
                placeholder="Ex: 7"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.sectionTitle}>Responsaveis</Text>
              {!canAddMoreGuardians && (
                <Text style={styles.lockedHint}>Mais responsaveis? Disponivel no Plus/Premium</Text>
              )}

              {formData.guardians.map((guardian, index) => (
                <View key={`guardian-${index}`} style={styles.guardianCard}>
                  <View style={styles.guardianHeader}>
                    <Text style={styles.guardianTitle}>Responsavel {index + 1}</Text>
                    {canAddMoreGuardians && index > 0 && (
                      <TouchableOpacity
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            guardians: prev.guardians
                              .filter((_, guardianIndex) => guardianIndex !== index)
                              .map((item, newIndex, arr) => {
                                if (arr.length === 1) {
                                  return { ...item, principal: true };
                                }
                                const hasPrincipal = arr.some((g) => g.principal);
                                if (!hasPrincipal && newIndex === 0) {
                                  return { ...item, principal: true };
                                }
                                return item;
                              }),
                          }))
                        }
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.status.alert} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>Responsavel</Text>
                  <TextInput
                    value={guardian.name}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardians: prev.guardians.map((item, guardianIndex) =>
                          guardianIndex === index ? { ...item, name: value } : item
                        ),
                      }))
                    }
                    placeholder="Nome do responsavel"
                    style={styles.input}
                  />

                  <Text style={styles.inputLabel}>Telefone</Text>
                  <TextInput
                    value={guardian.phone}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardians: prev.guardians.map((item, guardianIndex) =>
                          guardianIndex === index ? { ...item, phone: value } : item
                        ),
                      }))
                    }
                    placeholder="(11) 99999-9999"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />

                  <Text style={styles.inputLabel}>Whatsapp</Text>
                  <View style={styles.pcdButtons}>
                    <TouchableOpacity
                      style={[styles.optionButton, guardian.whatsapp && styles.optionButtonActive]}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guardians: prev.guardians.map((item, guardianIndex) =>
                            guardianIndex === index ? { ...item, whatsapp: true } : item
                          ),
                        }))
                      }
                    >
                      <Text style={[styles.optionButtonText, guardian.whatsapp && styles.optionButtonTextActive]}>
                        Sim
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, !guardian.whatsapp && styles.optionButtonActive]}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guardians: prev.guardians.map((item, guardianIndex) =>
                            guardianIndex === index ? { ...item, whatsapp: false } : item
                          ),
                        }))
                      }
                    >
                      <Text style={[styles.optionButtonText, !guardian.whatsapp && styles.optionButtonTextActive]}>
                        Nao
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Contato principal</Text>
                  <View style={styles.pcdButtons}>
                    <TouchableOpacity
                      style={[styles.optionButton, guardian.principal && styles.optionButtonActive]}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guardians: prev.guardians.map((item, guardianIndex) => ({
                            ...item,
                            principal: guardianIndex === index,
                          })),
                        }))
                      }
                    >
                      <Text style={[styles.optionButtonText, guardian.principal && styles.optionButtonTextActive]}>
                        Sim
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, !guardian.principal && styles.optionButtonActive]}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guardians: prev.guardians.map((item, guardianIndex) => {
                            if (guardianIndex === index && prev.guardians.length > 1) {
                              return { ...item, principal: false };
                            }
                            if (prev.guardians.length === 1) {
                              return { ...item, principal: true };
                            }
                            return item;
                          }),
                        }))
                      }
                    >
                      <Text style={[styles.optionButtonText, !guardian.principal && styles.optionButtonTextActive]}>
                        Nao
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {canAddMoreGuardians && (
                <TouchableOpacity
                  style={styles.addGuardianButton}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      guardians: [
                        ...prev.guardians.map((item, index) => ({
                          ...item,
                          principal: prev.guardians.length === 0 ? index === 0 : item.principal,
                        })),
                        { ...createEmptyGuardian(), principal: false },
                      ],
                    }))
                  }
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary[600]} />
                  <Text style={styles.addGuardianText}>Adicionar responsavel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.medicalHeader}
                onPress={() => setMedicalInfoExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.sectionTitle}>Informacoes Medicas</Text>
                  {!canEditMedicalInfo && <Text style={styles.lockedHint}>Disponivel no Plus/Premium</Text>}
                </View>
                <Ionicons
                  name={medicalInfoExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.neutral.text.secondary}
                />
              </TouchableOpacity>

              {medicalInfoExpanded && (
                <View style={!canEditMedicalInfo && styles.disabledSection}>
                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>PCD</Text>
                    <View style={styles.pcdButtons}>
                      <TouchableOpacity
                        style={[styles.optionButton, formData.pcd && styles.optionButtonActive]}
                        onPress={() => setFormData((prev) => ({ ...prev, pcd: true }))}
                        disabled={!canEditMedicalInfo}
                      >
                        <Text style={[styles.optionButtonText, formData.pcd && styles.optionButtonTextActive]}>Sim</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.optionButton, !formData.pcd && styles.optionButtonActive]}
                        onPress={() => setFormData((prev) => ({ ...prev, pcd: false }))}
                        disabled={!canEditMedicalInfo}
                      >
                        <Text style={[styles.optionButtonText, !formData.pcd && styles.optionButtonTextActive]}>Nao</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Planos de saude</Text>
                  <TextInput
                    value={formData.healthPlans}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, healthPlans: value }))}
                    placeholder="Unimed, Bradesco, ..."
                    style={styles.input}
                    editable={canEditMedicalInfo}
                  />

                  <Text style={styles.inputLabel}>Outras informacoes</Text>
                  <TextInput
                    value={formData.otherInfo}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, otherInfo: value }))}
                    placeholder="Informacoes adicionais"
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={canEditMedicalInfo}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setChildModalVisible(false)}
                variant="outline"
                size="small"
                style={styles.modalButton}
              />
              <Button
                title={editingChildId ? 'Salvar' : 'Cadastrar'}
                onPress={handleSaveChildProfile}
                loading={savingChild}
                variant="primary"
                size="small"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={confirmDeleteVisible}
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Excluir perfil</Text>
            <Text>Tem certeza que deseja excluir o perfil da criança?</Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setConfirmDeleteVisible(false)}
                variant="outline"
                size="small"
                style={styles.modalButton}
              />
              <Button
                title="Excluir"
                onPress={async () => {
                  setConfirmDeleteVisible(false);
                  try {
                    if (editingChildId) {
                      await removeChildProfile(editingChildId);
                      setRemoteChildren((prev) => prev.filter((c) => c.id !== editingChildId));
                    }
                  } catch (err) {
                    console.error('failed to delete child profile', err);
                    Alert.alert('Erro', 'Nao foi possivel excluir o perfil da criança.');
                  }
                }}
                variant="danger"
                size="small"
                style={styles.modalButton}
              />
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral.text.secondary,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.sm,
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.full,
    ...shadows.small,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.alert,
  },
  protectionCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  protectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protectionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  protectionDescription: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginTop: spacing.xs,
  },
  upgradeButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  scoreFactors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  factorItem: {
    flex: 1,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  factorName: {
    fontSize: 11,
    color: colors.neutral.text.muted,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.text.primary,
    marginTop: 2,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral.text.primary,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  activityTime: {
    fontSize: 12,
    color: colors.neutral.text.muted,
  },
  childContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  childItemCard: {
    marginTop: spacing.sm,
  },
  childBox: {
    marginBottom: 0,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  childPhoto: {
    width: '100%',
    height: '100%',
  },
  childInfo: {
    flex: 1,
  },
  nfcIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary[100],
    borderWidth: 1,
    borderColor: colors.secondary[300],
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  childAge: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginTop: 2,
    marginBottom: 4,
  },
  childActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral.background,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral.text.primary,
  },
  dangerText: {
    color: colors.status.alert,
  },
  tagPill: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.background,
  },
  tagPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  createChildButton: {
    marginTop: spacing.md,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: 12,
    color: colors.neutral.text.muted,
  },
  planCard: {
    backgroundColor: colors.primary[50],
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  planSubtitle: {
    fontSize: 12,
    color: colors.neutral.text.secondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
  },
  quickActionText: {
    fontSize: 12,
    color: colors.neutral.text.secondary,
    fontWeight: '500',
  },
  lockedIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.neutral.text.muted,
    borderRadius: 8,
    padding: 2,
  },
  lockedText: {
    color: colors.neutral.text.muted,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: colors.neutral.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.md,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral.text.primary,
    marginBottom: spacing.md,
  },
  nfcModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nfcTargetText: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginBottom: 2,
  },
  nfcTargetName: {
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  nfcLinkText: {
    fontSize: 12,
    color: colors.neutral.text.muted,
    marginBottom: spacing.sm,
  },
  nfcInstructionsBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.background,
    padding: spacing.sm,
  },
  nfcInstructionsTitle: {
    fontWeight: '700',
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs,
  },
  nfcInstructionItem: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginBottom: 2,
  },
  nfcStatusRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nfcStatusLabel: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
  },
  nfcStatusValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  nfcOk: {
    color: colors.status.active,
  },
  nfcError: {
    color: colors.status.alert,
  },
  nfcResultBox: {
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    padding: spacing.sm,
  },
  nfcResultSuccess: {
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  nfcResultError: {
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  nfcResultText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.neutral.text.primary,
  },
  textArea: {
    minHeight: 90,
  },
  guardianCard: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.background,
    padding: spacing.sm,
  },
  guardianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardianTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  addGuardianButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  addGuardianText: {
    color: colors.primary[700],
    fontWeight: '600',
    fontSize: 13,
  },
  medicalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral.text.primary,
  },
  lockedHint: {
    fontSize: 12,
    color: colors.status.warning,
    fontWeight: '600',
  },
  disabledSection: {
    opacity: 0.55,
  },
  switchRow: {
    marginTop: spacing.sm,
  },
  pcdButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral.background,
  },
  optionButtonActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[600],
  },
  optionButtonText: {
    color: colors.neutral.text.secondary,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: colors.primary[700],
  },
  slugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  slugText: {
    fontSize: 12,
    color: colors.neutral.text.muted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  protectionAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.greenSoft,
    opacity: 0.18,
  },
  protectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  protectionTextWrap: { flex: 1 },
  protectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.greenDark,
    letterSpacing: 0.2,
  },
  protectionDesc: {
    fontSize: 14,
    color: colors.grayText,
    marginTop: 2,
  },
  protectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grayMedium,
    gap: 10,
  },
  protectionStatus: {
    fontSize: 13,
    color: colors.greenSoft,
    fontWeight: '600',
  },
});
