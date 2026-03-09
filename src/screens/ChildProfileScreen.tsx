import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
// @ts-ignore: vector-icons types sometimes missing
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { useApp } from '../context/AppContext';
import { createChildEvent, getChildByPublicSlug } from '../services/pessoa-service.js';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { Footer } from '../components/Footer';
import { Platform } from 'react-native';

export function ChildProfileScreen() {
  const { state, emergencyMode, toggleEmergencyMode } = useApp();
  const { plan } = state;
  const route = useRoute<any>();

  const requestedId: string | undefined = route.params?.childId;
  const requestedSlug: string | undefined = route.params?.slug;

  const [resolvedChild, setResolvedChild] = React.useState<import('../types').Child | null>(null);
  const [resolvingChild, setResolvingChild] = React.useState(false);
  const [profileNotFound, setProfileNotFound] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sendingLocation, setSendingLocation] = React.useState(false);
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const resolveChild = async () => {
      setResolvedChild(null);
      setProfileNotFound(false);

      if (requestedId) {
        setResolvingChild(false);
        return;
      }

      if (!requestedSlug) {
        setResolvingChild(false);
        return;
      }

      const localChild = state.children.find((c) => c.slug === requestedSlug);
      if (localChild) {
        setResolvedChild(localChild);
        setResolvingChild(false);
        return;
      }

      setResolvingChild(true);
      try {
        const childBySlug = await getChildByPublicSlug(requestedSlug);
        if (cancelled) return;

        if (childBySlug) {
          setResolvedChild(childBySlug);
        } else {
          setProfileNotFound(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('error fetching child by slug', err);
          setProfileNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setResolvingChild(false);
        }
      }
    };

    resolveChild();

    return () => {
      cancelled = true;
    };
  }, [requestedId, requestedSlug, state.children]);

  const childById = requestedId ? state.children.find((c) => c.id === requestedId) : null;
  const child = resolvedChild || childById || (!requestedId && !requestedSlug ? state.children[0] : null);
  const photoUrl = typeof child?.photo === 'string' ? child.photo.trim() : '';

  const guardians = Array.isArray(child?.guardians) ? child.guardians : [];
  const primaryGuardian = guardians.find((guardian) => guardian?.principal) || guardians[0] || null;
  const scanLoggedRef = React.useRef<Record<string, boolean>>({});

  const normalizePhone = (phone?: string) => String(phone || '').replace(/\D/g, '');

  const handleCallPrimary = async () => {
    if (!primaryGuardian?.phone) {
      Alert.alert('Sem contato', 'Nao existe telefone principal cadastrado.');
      return;
    }
    const url = `tel:${primaryGuardian.phone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('cannot-open');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel capturar a localização.');
    } finally {
      setSendingLocation(false);
    }
  };

  const handleWhatsappPrimary = async () => {
    if (!primaryGuardian?.phone) {
      Alert.alert('Sem contato', 'Nao existe telefone principal cadastrado.');
      return;
    }
    if (!primaryGuardian?.whatsapp) {
      Alert.alert('WhatsApp indisponivel', 'O contato principal não possui WhatsApp habilitado.');
      return;
    }

    const phone = normalizePhone(primaryGuardian.phone);
    const url = `https://wa.me/55${phone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('cannot-open');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel capturar a localização.');
    } finally {
      setSendingLocation(false);
    }
  };

  const handleSendLocation = async () => {
    if (sendingLocation) return;

    setLocationStatus(null);
    setSendingLocation(true);

    const childName = child?.name || 'Criança';
    const ownerId = (child as any)?.ownerId;

    if (!ownerId || !child?.id) {
      setLocationStatus({
        type: 'error',
        message: 'Nao foi possivel identificar o cadastro.',
      });
      Alert.alert('Erro', 'Nao foi possivel identificar o cadastro.');
      setSendingLocation(false);
      return;
    }

    try {
      let latitude: number;
      let longitude: number;

      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          throw new Error('Geolocalizacao nao suportada no navegador');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          throw new Error('Permissao negada');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      const lat = latitude.toFixed(7);
      const lng = longitude.toFixed(7);

      const now = new Date();
      const hour = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await createChildEvent(ownerId, {
        type: 'location',
        childId: child.id,
        childName,
        location: `Lat ${lat}, Lng ${lng}`,
        message: `Localização de ${childName} enviada às ${hour}.`,
        latitude: Number(lat),
        longitude: Number(lng),
        timestamp: now,
      });

      setLocationStatus({
        type: 'success',
        message: 'Localização enviada com sucesso!',
      });

      Alert.alert('Localização enviada', 'A localização foi enviada ao responsável.');
    } catch (error: any) {
      console.error('location error:', error);

      setLocationStatus({
        type: 'error',
        message: 'Falha ao obter localização.',
      });

      Alert.alert(
        'Erro',
        'Nao foi possivel obter a localização. Verifique as permissões do navegador ou do celular.'
      );
    } finally {
      setSendingLocation(false);
    }
  };

  React.useEffect(() => {

    const registerScan = async () => {

      const ownerId = (child as any)?.ownerId;

      if (!ownerId || !child?.id) return;

      if (scanLoggedRef.current[child.id]) return;

      scanLoggedRef.current[child.id] = true;

      setTimeout(() => {
        delete scanLoggedRef.current[child.id];
      }, 30000);

      try {

        const now = new Date();
        const hour = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        await createChildEvent(ownerId, {
          type: 'scan',
          childId: child.id,
          childName: child.name || 'Criança',
          message: `A tag de ${child.name || 'Criança'} foi escaneada às ${hour}.`,
          timestamp: now,
        });

      } catch (err) {
        console.error('failed to create scan event', err);
        scanLoggedRef.current[child.id] = false;
      }

    };

    registerScan();

  }, [child?.id]);


  React.useEffect(() => {
    setImageLoadFailed(false);
  }, [child?.id, photoUrl]);

  if (resolvingChild) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.emptyStateText}>Buscando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!child || profileNotFound) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={30} color={colors.status.alert} />
          <Text style={styles.emptyStateTitle}>Perfil não encontrado</Text>
          <Text style={styles.emptyStateText}>O perfil pode ter sido removido ou o link esta invalido.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.sendLocationButton} onPress={handleSendLocation}>
            <Ionicons name="location-outline" size={16} color={colors.secondary[700]} />
            <Text style={styles.sendLocationText}>Enviar localização</Text>
          </TouchableOpacity>
          {/* <View style={styles.profileCard}>
            <Text style={styles.infoText}>Esta criança está identificada por um sistema de segurança.
              Se ela estiver perdida, entre em contato com os responsáveis.</Text>
          </View> */}
        </View>

        {locationStatus && (
          <View
            style={[
              styles.locationStatusBox,
              locationStatus.type === 'success' ? styles.locationStatusSuccess : styles.locationStatusError,
            ]}
          >
            <Text
              style={[
                styles.locationStatusText,
                locationStatus.type === 'success' ? styles.locationStatusTextSuccess : styles.locationStatusTextError,
              ]}
            >
              {locationStatus.message}
            </Text>
          </View>
        )}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {photoUrl && !imageLoadFailed ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              <Ionicons name="person" size={40} color={colors.neutral.white} />
            )}
          </View>
          <Text style={styles.name}>{child.name}</Text>
          <Text style={styles.age}>{child.age} anos</Text>
        </View>

        <View style={styles.contactActions}>
          <Button
            title="Ligar"
            onPress={handleCallPrimary}
            variant="primary"
            size="small"
            style={styles.contactButtonLigar}
            disabled={!primaryGuardian?.phone}
          />
          <Button
            title="WhatsApp"
            onPress={handleWhatsappPrimary}
            variant="success"
            size="small"
            style={styles.contactButtonWhatsapp}
            disabled={!primaryGuardian?.phone || !primaryGuardian?.whatsapp}
          />
        </View>

        <Card title="Responsáveis" subtitle={primaryGuardian ? `Principal: ${primaryGuardian.name}` : 'Nenhum contato cadastrado'}>
          {guardians.length > 0 ? (
            guardians.map((guardian, index) => (
              <View key={`guardian-${index}`} style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name={guardian.principal ? 'star' : 'person'} size={20} color={guardian.principal ? colors.secondary[600] : colors.primary[500]} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {guardian.name || 'Responsavel sem nome'} {guardian.principal ? '(Principal)' : ''}
                  </Text>
                  <Text style={styles.infoLabel}>{guardian.phone || 'Telefone não informado'}</Text>
                  <Text style={styles.infoLabel}>WhatsApp: {guardian.whatsapp ? 'Sim' : 'Nao'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.infoLabel}>Nenhum responsavel cadastrado.</Text>
          )}
        </Card>

        <Card title="Dados Médicos" >
          {child.medicalInfo && (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="accessibility" size={20} color={colors.status.alert} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>PCD</Text>
                  <Text style={styles.infoValue}>{child.medicalInfo.pcd ? 'Sim' : 'Nao'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="medkit" size={20} color={colors.status.warning} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Planos de saude</Text>
                  <Text style={styles.infoValue}>{child.medicalInfo.healthPlans || 'Nao informado'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="document-text" size={20} color={colors.secondary[500]} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Outras informacoes</Text>
                  <Text style={styles.infoValue}>{child.medicalInfo.otherInfo || 'Nao informado'}</Text>
                </View>
              </View>
            </>
          )}
        </Card>
        <Footer />
      </ScrollView>
      {sendingLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayCard}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingOverlayText}>Enviando localização...</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  sendLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.secondary[100],
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: spacing.md,
  },
  sendLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary[700],
  },
  infoTextContainer: {
    borderRadius: borderRadius.full,
    color: colors.neutral.white,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral.text.primary,
    display: 'flex',
    textAlign: 'center',
  },
  locationStatusBox: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  locationStatusSuccess: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  locationStatusError: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  locationStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationStatusTextSuccess: {
    color: colors.primary[700],
  },
  locationStatusTextError: {
    color: colors.status.alert,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contactButton: {
    flex: 1,
  },
  contactButtonLigar: {
    flex: 1,
    backgroundColor: colors.secondary[500],
  },
  contactButtonWhatsapp: {
    flex: 1,
    backgroundColor: colors.primary[500],
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral.text.primary,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayCard: {
    backgroundColor: colors.neutral.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  loadingOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
});

