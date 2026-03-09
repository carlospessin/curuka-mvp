const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { Expo } = require("expo-server-sdk");

admin.initializeApp();

const db = admin.firestore();
const expo = new Expo();

exports.sendChildEventPush = onDocumentCreated(
  "childEvents/{eventId}",
  async (event) => {

    const snapshot = event.data;

    if (!snapshot) return;

    const data = snapshot.data();
    const ownerId = data.ownerId;

    if (!ownerId) {
      logger.warn("childEvent without ownerId");
      return;
    }

    const tokensSnapshot = await db
      .collection("pushTokens")
      .where("ownerId", "==", ownerId)
      .get();

    if (tokensSnapshot.empty) {
      logger.info("no push tokens for owner", { ownerId });
      return;
    }

    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data()?.token)
      .filter((token) => typeof token === "string" && Expo.isExpoPushToken(token));

    if (tokens.length === 0) {
      logger.info("no valid expo push tokens", { ownerId });
      return;
    }

    const childName = data.childName || "Criança";

    const body =
      data.message ||
      (data.type === "location"
        ? `Localização de ${childName} enviada.`
        : `A tag de ${childName} foi escaneada.`);

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: "Curuka",
      body,
      channelId: "default",
      data: {
        type: data.type || "event",
        childId: data.childId || "",
      },
    }));

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        logger.error("failed to send push notification", error);
      }
    }
  }
);