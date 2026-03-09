import * as Notifications from "expo-notifications";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  return token;
}

export async function savePushToken(uid: string, token: string) {
  await setDoc(
    doc(db, "pushTokens", uid),
    {
      token,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

export async function sendPushNotification(uid: string, message: string) {

  const tokenDoc = await getDoc(doc(db, "pushTokens", uid));

  if (!tokenDoc.exists()) return;

  const token = tokenDoc.data().token;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title: "Curuka",
      body: message,
      data: { type: "child-event" },
    }),
  });
}