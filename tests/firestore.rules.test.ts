import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect, describe } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)(
  "Firestore: изоляция пользователей",
  () => {
    let env: RulesTestEnvironment;
    beforeAll(async () => {
      env = await initializeTestEnvironment({
        projectId: "demo-tishe",
        firestore: { rules: readFileSync("firestore.rules", "utf8") },
      });
    });
    afterAll(async () => {
      await env?.cleanup();
    });
    it("владелец создаёт и читает свою запись", async () => {
      const db = env.authenticatedContext("alice").firestore();
      const ref = doc(db, "users/alice/events/one");
      await assertSucceeds(
        setDoc(ref, {
          id: "one",
          day: "2026-11-11",
          at: "2026-11-11T10:00:00.000Z",
          createdAt: "2026-11-11T10:00:00.000Z",
        }),
      );
      expect((await assertSucceeds(getDoc(ref))).exists()).toBe(true);
    });
    it("другой аккаунт не читает и не пишет чужие данные", async () => {
      const db = env.authenticatedContext("bob").firestore();
      await assertFails(getDoc(doc(db, "users/alice/events/one")));
      await assertFails(
        setDoc(doc(db, "users/alice/zeros/2026-11-11"), { day: "2026-11-11" }),
      );
    });
    it("анонимный запрос запрещён", async () => {
      await assertFails(
        getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice")),
      );
    });
    it("поля вне схемы запрещены", async () => {
      await assertFails(
        setDoc(
          doc(
            env.authenticatedContext("alice").firestore(),
            "users/alice/events/bad",
          ),
          {
            id: "bad",
            day: "2026-11-11",
            at: "2026-11-11T10:00:00.000Z",
            createdAt: "2026-11-11T10:00:00.000Z",
            extra: true,
          },
        ),
      );
    });
    it("подтверждение нуля принадлежит только владельцу", async () => {
      const db = env.authenticatedContext("alice").firestore();
      await assertSucceeds(
        setDoc(doc(db, "users/alice/zeros/2026-11-10"), { day: "2026-11-10" }),
      );
      await assertFails(
        setDoc(doc(db, "users/alice/zeros/2026-11-09"), { day: "2026-11-10" }),
      );
    });
  },
);
