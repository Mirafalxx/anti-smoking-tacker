import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../shared/lib/firebase";
import { dayKey } from "../../shared/lib/dates";
import {
  emptyData,
  countDay,
  type Entry,
  type Data,
} from "../../shared/model/tracker";

type Options = {
  user: User | null;
  zone: string;
  start: string;
  end: string;
  online: boolean;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
};
const DEMO_STORAGE_KEY = "tishe-demo";
export function useTrackerData({
  user,
  zone,
  start,
  end,
  online,
  onError,
  onNotice,
}: Options) {
  const [data, setData] = useState<Data>(emptyData);
  const [demo, setDemo] = useState(false);
  const [pending, setPending] = useState(false);
  const [cached, setCached] = useState(false);
  const writes = useRef(new Set<Promise<void>>());
  useEffect(() => {
    if (demo) return;
    setData(emptyData());
    if (!user || !db) {
      setCached(false);
      return;
    }
    setCached(true);
    let eventPending = false,
      zeroPending = false;
    const report = (error: unknown) =>
      onError(
        error instanceof Error ? error.message : "Ошибка доступа к данным",
      );
    const off = onSnapshot(
      query(
        collection(db, "users", user.uid, "events"),
        where("day", ">=", start),
        where("day", "<=", end),
      ),
      { includeMetadataChanges: true },
      (snap) => {
        setData((data) => ({
          ...data,
          events: snap.docs.map(
            (document) => ({ id: document.id, ...document.data() }) as Entry,
          ),
        }));
        eventPending = snap.metadata.hasPendingWrites;
        setPending(eventPending || zeroPending || writes.current.size > 0);
        setCached(snap.metadata.fromCache);
      },
      report,
    );
    const offZero = onSnapshot(
      query(
        collection(db, "users", user.uid, "zeros"),
        where("day", ">=", start),
        where("day", "<=", end),
      ),
      { includeMetadataChanges: true },
      (snap) => {
        setData((data) => ({
          ...data,
          zeros: snap.docs.map((document) => document.id),
        }));
        zeroPending = snap.metadata.hasPendingWrites;
        setPending(eventPending || zeroPending || writes.current.size > 0);
      },
      report,
    );
    return () => {
      off();
      offZero();
    };
  }, [user, demo, start, end, onError]);
  function enterDemo() {
    setDemo(true);
    try {
      setData(
        JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || "null") ||
          emptyData(),
      );
    } catch {
      setData(emptyData());
    }
  }
  function exitDemo() {
    setDemo(false);
    setData(emptyData());
  }
  function local(next: Data) {
    setData(next);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
  }
  function persist(write: Promise<void>) {
    writes.current.add(write);
    setPending(true);
    void write
      .catch((error) =>
        onError(
          error instanceof Error
            ? error.message
            : "Не удалось сохранить запись",
        ),
      )
      .finally(() => {
        writes.current.delete(write);
        setPending(writes.current.size > 0);
      });
  }
  function add(
    at = new Date().toISOString(),
    id: string = crypto.randomUUID(),
    createdAt = new Date().toISOString(),
  ) {
    if (new Date(at) > new Date()) {
      onError("Нельзя добавлять записи в будущем");
      return false;
    }
    const entry: Entry = { id, at, day: dayKey(new Date(at), zone), createdAt };
    if (demo)
      local({
        ...data,
        events: [...data.events.filter((event) => event.id !== id), entry],
      });
    else if (user && db)
      persist(setDoc(doc(db, "users", user.uid, "events", id), entry));
    else return false;
    onNotice("Запись сохранена" + (!online ? " на устройстве" : ""));
    return true;
  }
  function remove(entry: Entry) {
    if (demo)
      local({
        ...data,
        events: data.events.filter((event) => event.id !== entry.id),
      });
    else if (user && db)
      persist(deleteDoc(doc(db, "users", user.uid, "events", entry.id)));
  }
  function zero(day: string) {
    if (countDay(data.events, day)) return;
    if (demo) local({ ...data, zeros: [...new Set([...data.zeros, day])] });
    else if (user && db)
      persist(setDoc(doc(db, "users", user.uid, "zeros", day), { day }));
  }
  return {
    data,
    demo,
    pending,
    cached,
    enterDemo,
    exitDemo,
    add,
    remove,
    zero,
  };
}
