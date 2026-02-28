import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
