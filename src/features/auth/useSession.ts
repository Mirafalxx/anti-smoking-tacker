import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  waitForPendingWrites,
  terminate,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { auth, db, configured, login } from "../../shared/lib/firebase";

export function useSession(onError: (message: string) => void) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!configured);
  const [zone, setZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [authBusy, setAuthBusy] = useState(false);
  useEffect(() => {
    if (!auth) return;
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(null);
      setReady(false);
      try {
        if (currentUser && db) {
          const ref = doc(db, "users", currentUser.uid);
          const snapshot = await getDoc(ref);
          const timeZone =
            snapshot.data()?.timeZone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (!snapshot.exists()) await setDoc(ref, { timeZone });
          if (active) {
            setZone(timeZone);
            setUser(currentUser);
          }
        }
      } catch {
        if (active)
          onError(
            "Не удалось загрузить профиль. Проверьте соединение и обновите страницу.",
          );
      } finally {
        if (active) setReady(true);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [onError]);
  function signIn() {
    setAuthBusy(true);
    void login()
      .catch(() =>
        onError(
          "Не удалось войти. Проверьте сеть и разрешите всплывающие окна.",
        ),
      )
      .finally(() => setAuthBusy(false));
  }
  async function logout(pending: boolean, online: boolean) {
    if (pending || !online) {
      onError(
        "Перед выходом подключитесь к сети и дождитесь синхронизации записей.",
      );
      return;
    }
    try {
      if (db && auth) {
        await waitForPendingWrites(db);
        await signOut(auth);
        await terminate(db);
        await clearIndexedDbPersistence(db);
        location.reload();
      }
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Не удалось выйти из аккаунта",
      );
    }
  }
  return { user, ready, zone, authBusy, signIn, logout };
}
