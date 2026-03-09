const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
// index.ts
import { AppRegistry } from 'react-native';
import { getMessaging } from '@react-native-firebase/messaging';
import App from './App';

// Handler para mensagens quando o app está completamente fechado
getMessaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[push] app fechado, mensagem recebida:', remoteMessage);
});

AppRegistry.registerComponent('main', () => App);

admin.initializeApp();

exports.sendChildEventPush = onDocumentCreated(
  "childEvents/{eventId}",
  async (event) => {
    const data = event.data.data();
    const ownerId = data.ownerId;

    console.log("[push] evento recebido:", { ownerId, type: data.type });

    if (!ownerId) return;

    const settingsDoc = await admin.firestore().collection("settings").doc(ownerId).get();
    if (!settingsDoc.exists) return;

    const tokens = settingsDoc.data().pushTokens || [];
    console.log("[push] tokens:", tokens);
    if (!tokens.length) return;

    // Filtra só tokens FCM (não Expo)
    const fcmTokens = tokens.filter(t => !t.startsWith("ExponentPushToken"));

    if (!fcmTokens.length) {
      console.log("[push] nenhum token FCM encontrado, só tokens Expo");
      return;
    }

    const message = {
      notification: {
        title: "Curuka",
        body: data.message || "Nova notificação",
      },
      data: {
        type: data.type || "",
        childId: data.childId || "",
      },
      tokens: fcmTokens,
    };

    const result = await admin.messaging().sendEachForMulticast(message);
    console.log("[push] enviado:", result.successCount, "sucesso,", result.failureCount, "falha");
  }
);