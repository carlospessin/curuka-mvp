import { Platform } from "react-native";
import {
  deleteUser,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { auth } from "../config/firebase.js";
import { syncPushTokenForUser } from "./push-notifications";

let googleConfigured = false;

function mapAuthError(error, fallbackMessage) {
  const code = typeof error?.code === "string" ? error.code : "";

  switch (code) {
    case "auth/invalid-email":
      return "Email invalido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email ou senha incorretos.";
    case "auth/email-already-in-use":
      return "Este email ja esta em uso.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/account-exists-with-different-credential":
      return "Esta conta ja existe com outro metodo de login.";
    case "auth/popup-closed-by-user":
      return "Login com Google cancelado antes da conclusao.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela de login do Google.";
    case "auth/network-request-failed":
      return "Falha de conexao. Verifique sua internet e tente novamente.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente em instantes.";
    case "auth/requires-recent-login":
      return "Por seguranca, faca login novamente antes de excluir a conta.";
    case statusCodes.SIGN_IN_CANCELLED:
      return "Login com Google cancelado.";
    case statusCodes.IN_PROGRESS:
      return "O login com Google ja esta em andamento.";
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return "Google Play Services indisponivel neste dispositivo.";
    default:
      return error instanceof Error && error.message ? error.message : fallbackMessage;
  }
}

function configureGoogleSignin() {
  if (googleConfigured || Platform.OS === "web") {
    return;
  }

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    scopes: ["profile", "email"],
  });

  googleConfigured = true;
}

export async function loginOrRegisterWithEmail(email, password) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "").trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error("Informe email e senha.");
  }

  try {
    const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);

    const credential = methods.length
      ? await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword)
      : await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);

    const user = credential.user;

    await syncPushTokenForUser(user.uid, true).catch((err) => {
      console.warn('push token sync failed after login', err);
    });

    return user;
  } catch (error) {
    throw new Error(mapAuthError(error, "Falha ao entrar com email."));
  }
}

export async function loginWithGooglePopup() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  } catch (error) {
    throw new Error(mapAuthError(error, "Falha ao entrar com Google."));
  }
}

export async function loginWithGoogleNative() {
  configureGoogleSignin();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      throw new Error("Login com Google cancelado.");
    }

    if (!isSuccessResponse(response)) {
      throw new Error("Nao foi possivel concluir o login com Google.");
    }

    const idToken = response.data.idToken;

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);

    const user = result.user;
    await syncPushTokenForUser(user.uid, true).catch((err) => {
      console.warn('push token sync failed after login', err);
    });
    return user;
  } catch (error) {
    throw new Error(mapAuthError(error, "Falha ao entrar com Google."));
  }
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function updateCurrentUserDisplayName(displayName) {
  const cleanName = String(displayName || "").trim();

  if (!cleanName) {
    throw new Error("Informe um nome valido.");
  }

  if (!auth.currentUser) {
    throw new Error("Nenhum usuario autenticado.");
  }

  try {
    await updateProfile(auth.currentUser, { displayName: cleanName });
    return auth.currentUser;
  } catch (error) {
    throw new Error(mapAuthError(error, "Nao foi possivel atualizar o nome."));
  }
}

export async function deleteCurrentUserAccount() {
  if (!auth.currentUser) {
    throw new Error("Nenhum usuario autenticado.");
  }

  try {
    await deleteUser(auth.currentUser);
  } catch (error) {
    throw new Error(mapAuthError(error, "Nao foi possivel excluir a conta."));
  }
}

export async function logout() {
  await signOut(auth);

  if (Platform.OS !== "web") {
    configureGoogleSignin();

    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore native sign-out errors to avoid blocking local logout.
    }
  }
}
