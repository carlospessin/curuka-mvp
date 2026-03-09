import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as ExpoNotifications from 'expo-notifications';
import { getMessaging, getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { removePushToken, savePushToken } from './pessoa-service.js';

export { ExpoNotifications as Notifications };

const STORED_PUSH_TOKEN_KEY = 'curuka_push_token';
const STORED_PUSH_OWNER_KEY = 'curuka_push_owner';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) throw new Error('Push notifications exigem um dispositivo fisico.');

  const messaging = getMessaging();

  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (!enabled) throw new Error('Permissao de notificacao negada.');

  const token = await getToken(messaging);
  console.log('[push] FCM token:', token);
  return token;
}

export async function syncPushTokenForUser(ownerId: string, enabled: boolean) {
  if (Platform.OS === 'web') return null;

  const previousToken = await AsyncStorage.getItem(STORED_PUSH_TOKEN_KEY);
  const previousOwnerId = await AsyncStorage.getItem(STORED_PUSH_OWNER_KEY);

  if (!ownerId || !enabled) {
    if (previousToken && previousOwnerId) {
      await removePushToken(previousOwnerId, previousToken);
    }
    await AsyncStorage.multiRemove([STORED_PUSH_TOKEN_KEY, STORED_PUSH_OWNER_KEY]);
    return null;
  }

  const token = await registerForPushNotificationsAsync();
  if (!token) return null;

  if (previousToken && previousOwnerId && (previousToken !== token || previousOwnerId !== ownerId)) {
    await removePushToken(previousOwnerId, previousToken);
  }

  await savePushToken(ownerId, token, {
    platform: Platform.OS,
    deviceName: Device.deviceName || null,
  });

  await AsyncStorage.multiSet([
    [STORED_PUSH_TOKEN_KEY, token],
    [STORED_PUSH_OWNER_KEY, ownerId],
  ]);

  return token;
}

export function getNotificationHistoryTarget(data: Record<string, unknown> | undefined) {
  if (!data) return false;
  return data.screen === 'History';
}