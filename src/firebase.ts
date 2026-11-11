import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
const env = import.meta.env;
export const configured = [
  env.VITE_FIREBASE_API_KEY,
  env.VITE_FIREBASE_PROJECT_ID,
  env.VITE_FIREBASE_AUTH_DOMAIN,
  env.VITE_FIREBASE_APP_ID,
].every(
  (value) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.startsWith("TMP_"),
);
const app = configured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  : null;
export const auth = app ? getAuth(app) : null;
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : null;
export const login = () => {
  if (!auth) throw Error("Firebase не настроен");
  return signInWithPopup(auth, new GoogleAuthProvider());
};
