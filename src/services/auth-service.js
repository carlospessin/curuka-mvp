import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase.js";

export async function loginOrRegisterWithEmail(email, password) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "").trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error("Informe email e senha.");
  }

  const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);

  const credential = methods.length
    ? await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword)
    : await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);

  return credential.user;
}

export async function loginWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function loginWithGoogleIdToken(idToken, accessToken) {
  if (!idToken) {
    throw new Error("Token do Google não recebido.");
  }

  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function logout() {
  await signOut(auth);
}
