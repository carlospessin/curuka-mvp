import { getApp, getApps, initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase-config.js";

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || String(value).startsWith("REPLACE_WITH_"))
  .map(([key]) => key);

if (missingConfig.length > 0) {
  throw new Error(`Firebase configuration is missing: ${missingConfig.join(", ")}`);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);