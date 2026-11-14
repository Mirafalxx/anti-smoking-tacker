import { expect, it } from "vitest";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

it("регистрирует Firestore в Firebase compat, используемом тестами правил", async () => {
  // No rules upload or database requests: SDK registration needs no running emulator.
  const environment = await initializeTestEnvironment({
    projectId: "demo-sdk-registration",
    firestore: { host: "127.0.0.1", port: 8080 },
  });
  try {
    const firestore = environment.authenticatedContext("alice").firestore();
    expect(typeof firestore.collection).toBe("function");
    expect(firestore.app.options).toEqual(
      expect.objectContaining({ projectId: "demo-sdk-registration" }),
    );
  } finally {
    await environment.cleanup();
  }
});
