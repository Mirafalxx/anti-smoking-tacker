import { expect, it } from "vitest";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  memoryLocalCache,
  terminate,
} from "firebase/firestore";

it("регистрирует Auth и Firestore в одном экземпляре Firebase App", async () => {
  const app = initializeApp(
    { apiKey: "test-api-key", projectId: "demo-tishe", appId: "test-app" },
    "initialization-test",
  );
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  try {
    expect(getAuth(app).app).toBe(app);
    expect(db.app).toBe(app);
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
});
