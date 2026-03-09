import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { removePushToken, savePushToken } from './pessoa-service.js';

const STORED_PUSH_TOKEN_KEY = 'curuka_push_token';
const STORED_PUSH_OWNER_KEY = 'curuka_push_owner';

function getProjectId() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    throw new Error('EAS projectId nao configurado para push notifications.');
  }

  return projectId;
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    throw new Error('Push notifications exigem um dispositivo fisico.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2B7FFF',
    });
  }

  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = currentStatus;

  if (currentStatus !== 'granted') {
    const permissionResponse = await Notifications.requestPermissionsAsync();
    finalStatus = permissionResponse.status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Permissao de notificacao negada.');
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId: getProjectId(),
  });

  return pushToken.data;
}

export async function syncPushTokenForUser(ownerId: string, enabled: boolean) {
  if (Platform.OS === 'web') {
    return null;
  }

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
  if (!token) {
    return null;
  }

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

export { Notifications };
