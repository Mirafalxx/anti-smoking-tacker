import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  ChartNoAxesCombined,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Leaf,
  LogOut,
  WifiOff,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  terminate,
  clearIndexedDbPersistence,
  waitForPendingWrites,
} from "firebase/firestore";
import { auth, db, configured, login } from "./firebase";
import { Entry, Data, dayKey, daysBetween, countDay, labelDay } from "./model";
import s from "./style.module.css";
import { registerSW } from "virtual:pwa-register";
const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm("Доступно обновление приложения. Обновить?"))
      void updateSW(true);
  },
});

const blank: Data = { events: [], zeros: [] };
function App() {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(!configured),
    [demo, setDemo] = useState(false),
    [data, setData] = useState<Data>(blank),
    [zone, setZone] = useState(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
    [view, setView] = useState(
      location.hash === "#/stats" ? "stats" : "calendar",
    ),
    [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [selected, setSelected] = useState<string | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [pending, setPending] = useState(false),
    [cached, setCached] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [profile, setProfile] = useState(false),
    [authBusy, setAuthBusy] = useState(false);
  const writes = useRef(new Set<Promise<void>>());
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.querySelector<HTMLElement>("button, input")?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setEditing(null);
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled)",
        ) || [],
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [selected]);
  const today = dayKey(new Date(), zone),
    monthStart = dayKey(new Date(month.getFullYear(), month.getMonth(), 1, 12)),
    monthEnd = dayKey(
      new Date(month.getFullYear(), month.getMonth() + 1, 0, 12),
    );
  const [range, setRange] = useState({ start: monthStart, end: today }),
    [editing, setEditing] = useState<Entry | null>(null),
    [editValue, setEditValue] = useState("");
  const start = view === "stats" ? range.start : monthStart,
    end = view === "stats" ? range.end : monthEnd;
  useEffect(() => {
    const change = () =>
      setView(location.hash === "#/stats" ? "stats" : "calendar");
    const net = () => setOnline(navigator.onLine);
    window.addEventListener("hashchange", change);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
    };
  }, []);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(null);
      setData(blank);
      setReady(false);
      try {
        if (u && db) {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          const tz =
            snap.data()?.timeZone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (!snap.exists()) await setDoc(ref, { timeZone: tz });
          setZone(tz);
          setUser(u);
        }
      } catch {
        setError(
          "Не удалось загрузить профиль. Проверьте соединение и обновите страницу.",
        );
      } finally {
        setReady(true);
      }
    });
  }, []);
  useEffect(() => {
    if (!user || !db || demo) return;
    setData(blank);
    setCached(true);
    const base = collection(db, "users", user.uid, "events");
    let eventPending = false,
      zeroPending = false;
    const report = (e: unknown) =>
      setError(e instanceof Error ? e.message : "Ошибка доступа к данным");
    const off = onSnapshot(
      query(base, where("day", ">=", start), where("day", "<=", end)),
      { includeMetadataChanges: true },
      (snap) => {
        setData((d) => ({
          ...d,
          events: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Entry),
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
        setData((d) => ({ ...d, zeros: snap.docs.map((d) => d.id) }));
        zeroPending = snap.metadata.hasPendingWrites;
        setPending(eventPending || zeroPending || writes.current.size > 0);
      },
      report,
    );
    return () => {
      off();
      offZero();
    };
  }, [user, demo, start, end]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  function enterDemo() {
    setDemo(true);
    try {
      setData(
        JSON.parse(localStorage.getItem("tishe-demo") || "null") || blank,
      );
    } catch {
      setData(blank);
    }
  }
  function local(next: Data) {
    setData(next);
    localStorage.setItem("tishe-demo", JSON.stringify(next));
  }
  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : "Не удалось сохранить запись");
  }
  function persist(write: Promise<void>) {
    writes.current.add(write);
    setPending(true);
    void write.catch(fail).finally(() => {
      writes.current.delete(write);
      setPending(writes.current.size > 0);
    });
  }
  function add(
    at = new Date().toISOString(),
    id: string = crypto.randomUUID(),
    createdAt = new Date().toISOString(),
  ) {
    const entry: Entry = {
      id,
      at,
      day: dayKey(new Date(at), zone),
      createdAt,
    };
    if (new Date(at) > new Date()) {
      setError("Нельзя добавлять записи в будущем");
      return;
    }
    if (demo)
      local({
        ...data,
        events: [...data.events.filter((e) => e.id !== id), entry],
      });
    else if (user && db) {
      setPending(true);
      persist(setDoc(doc(db, "users", user.uid, "events", id), entry));
    }
    setNotice("Запись сохранена" + (!online ? " на устройстве" : ""));
    setEditing(null);
  }
  function remove(e: Entry) {
    if (demo)
      local({ ...data, events: data.events.filter((i) => i.id !== e.id) });
    else if (user && db)
      persist(deleteDoc(doc(db, "users", user.uid, "events", e.id)));
  }
  function zero(day: string) {
    if (countDay(data.events, day)) return;
    if (demo) local({ ...data, zeros: [...new Set([...data.zeros, day])] });
    else if (user && db)
      persist(setDoc(doc(db, "users", user.uid, "zeros", day), { day }));
  }
  async function logout() {
    if (pending || !online) {
      setError(
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
    } catch (e) {
      fail(e);
    }
  }
  const visibleDays = daysBetween(start, end),
    total = data.events.filter((e) => e.day >= start && e.day <= end).length,
    confirmed = data.zeros.filter(
      (d) => d >= start && d <= end && !countDay(data.events, d),
    ).length;
  const monthDays = daysBetween(monthStart, monthEnd),
    offset =
      (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const go = (v: string) => {
    location.hash = v === "stats" ? "/stats" : "/";
    setView(v);
    setSelected(null);
  };
  const changeMonth = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  function preset(n: number) {
    const date = new Date(today + "T12:00:00");
    date.setDate(date.getDate() - n + 1);
    setRange({ start: dayKey(date), end: today });
  }
  function openEdit(e?: Entry) {
    const date = e
      ? new Date(e.at)
      : new Date((selected || today) + "T12:00:00");
    setEditing(
      e || {
        id: crypto.randomUUID(),
        day: selected || today,
        at: "",
        createdAt: "",
      },
    );
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    setEditValue(
      e
        ? parts.replace(" ", "T")
        : `${selected || today}T${selected === today ? new Intl.DateTimeFormat("sv-SE", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()) : "12:00"}`,
    );
  }
  function saveEdit() {
    // Convert wall-clock input in the profile timezone, including device timezone differences.
    const wall = new Date(editValue + "Z");
    if (!Number.isFinite(+wall)) return;
    let instant = wall;
    for (let i = 0; i < 3; i++) {
      const p = new Intl.DateTimeFormat("sv-SE", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
        .format(instant)
        .replace(" ", "T");
      instant = new Date(+instant + (+wall - +new Date(p + "Z")));
    }
    if (editing)
      add(
        instant.toISOString(),
        editing.id,
        editing.createdAt || new Date().toISOString(),
      );
  }
  return (
    <div className={s.app}>
      <header className={s.header}>
        <a className={s.brand} href="#/" onClick={() => go("calendar")}>
          <span className={s.logo}>
            <Leaf size={23} />
          </span>
          тише<span className={s.brandCaption}>Личный трекер курения</span>
        </a>
        <div className={s.headerRight}>
          <span className={s.connection}>
            {!online ? (
              <>
                <WifiOff size={14} /> Офлайн
              </>
            ) : pending ? (
              "Синхронизация…"
            ) : demo ? (
              "Демо · на устройстве"
            ) : user ? (
              "Данные синхронизированы"
            ) : (
              ""
            )}
          </span>
          <button
            className={s.avatar}
            aria-label="Профиль"
            onClick={() => setProfile(!profile)}
          >
            {user?.displayName?.slice(0, 1) || "Я"}
          </button>
        </div>
      </header>
      {profile && (
        <div className={s.profile}>
          <b>{user?.displayName || "Демонстрационный режим"}</b>
          <p>{user?.email || "Данные хранятся только в этом браузере"}</p>
          <small>Часовой пояс: {zone}</small>
          <button
            onClick={() =>
              demo
                ? (setDemo(false), setData(blank), setProfile(false))
                : void logout()
            }
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className={s.error}>
          {error}
          <button aria-label="Закрыть ошибку" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}
      {!ready ? (
        <main className={s.welcome}>
          <Leaf />
          <h1>Загружаем ваш календарь…</h1>
        </main>
      ) : !user && !demo ? (
        <main className={s.welcome}>
          <span className={s.eyebrow}>В СВОЁМ ТЕМПЕ</span>
          <h1>
            Маленькие шаги.
            <br />
            Больше осознанности.
          </h1>
          <p>
            Отмечайте каждую сигарету, наблюдайте за привычкой
            <br />и постепенно находите свой ритм.
          </p>
          <button
            className={s.primary}
            disabled={!configured || authBusy}
            onClick={() => {
              setAuthBusy(true);
              void login()
                .catch(() =>
                  setError(
                    "Не удалось войти. Проверьте сеть и разрешите всплывающие окна.",
                  ),
                )
                .finally(() => setAuthBusy(false));
            }}
          >
            Войти через Google <ArrowUpRight size={18} />
          </button>
          {!configured && (
            <small>
              Для входа необходимо подключить Firebase. Инструкция — в README.
            </small>
          )}
          <button className={s.textButton} onClick={enterDemo}>
            Посмотреть приложение в деморежиме →
          </button>
          <div className={s.welcomeFeatures}>
            <span>
              <CalendarDays /> Календарь привычки
            </span>
            <span>
              <ChartNoAxesCombined /> Понятная статистика
            </span>
            <span>
              <WifiOff /> Доступ без сети
            </span>
          </div>
        </main>
      ) : (
        <>
          <main className={s.main}>
            <div className={s.pageHeading}>
              <div>
                <span className={s.eyebrow}>ДЕНЬ ЗА ДНЁМ</span>
                <h1>
                  {view === "calendar" ? "Ваш календарь" : "Ваша статистика"}
                </h1>
                <p>
                  {view === "calendar"
                    ? "Замечайте привычку. Двигайтесь в своём темпе."
                    : "Взгляд на привычку через цифры."}
                </p>
              </div>
              <span className={s.dateBadge}>
                {new Date().toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                  timeZone: zone,
                })}
              </span>
            </div>
            <nav className={s.tabs}>
              <button
                className={view === "calendar" ? s.tabActive : ""}
                onClick={() => go("calendar")}
              >
                <CalendarDays size={17} /> Календарь
              </button>
              <button
                className={view === "stats" ? s.tabActive : ""}
                onClick={() => go("stats")}
              >
                <ChartNoAxesCombined size={18} /> Статистика
              </button>
            </nav>
            {demo && (
              <div className={s.demo}>
                Деморежим · записи сохраняются только на этом устройстве
              </div>
            )}
            {!demo && (cached || !online) && (
              <div className={s.demo}>
                Данные из кеша могут быть неполными.{" "}
                {pending
                  ? "Изменения ожидают отправки."
                  : "Полная статистика доступна после соединения с сервером."}
              </div>
            )}
            {view === "stats" && (
              <section className={s.filters}>
                <div className={s.presets}>
                  <button
                    onClick={() => {
                      const d = new Date();
                      setRange({
                        start: dayKey(
                          new Date(d.getFullYear(), d.getMonth(), 1, 12),
                        ),
                        end: today,
                      });
                    }}
                  >
                    Этот месяц
                  </button>
                  <button onClick={() => preset(7)}>7 дней</button>
                  <button onClick={() => preset(30)}>30 дней</button>
                </div>
                <label>
                  С{" "}
                  <input
                    type="date"
                    value={range.start}
                    max={range.end}
                    onChange={(e) =>
                      e.target.value &&
                      setRange({ ...range, start: e.target.value })
                    }
                  />
                </label>
                <label>
                  По{" "}
                  <input
                    type="date"
                    value={range.end}
                    min={range.start}
                    max={today}
                    onChange={(e) =>
                      e.target.value &&
                      setRange({ ...range, end: e.target.value })
                    }
                  />
                </label>
              </section>
            )}
            <div className={s.summary}>
              <article>
                <span>
                  {view === "calendar"
                    ? "Сигарет за месяц"
                    : "Сигарет за период"}
                </span>
                <strong>
                  {total}
                  <small> шт.</small>
                </strong>
                <p>Каждая запись — шаг к пониманию</p>
              </article>
              <article>
                <span>Дней без курения</span>
                <strong>
                  {confirmed}
                  <small> дн.</small>
                </strong>
                <p>Только подтверждённые дни</p>
              </article>
              <article className={s.todayCard}>
                <span>Сегодня</span>
                <strong>
                  {today >= start && today <= end
                    ? countDay(data.events, today)
                    : "—"}
                  <small> шт.</small>
                </strong>
                <p>Отмечайте сразу после курения</p>
              </article>
            </div>
            {view === "calendar" ? (
              <section className={s.calendar}>
                <div className={s.calendarHeader}>
                  <h2>
                    {month.toLocaleDateString("ru-RU", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <div>
                    <button
                      className={s.todayButton}
                      onClick={() =>
                        setMonth(
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            1,
                          ),
                        )
                      }
                    >
                      Сегодня
                    </button>
                    <button
                      aria-label="Предыдущий месяц"
                      onClick={() => changeMonth(-1)}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      aria-label="Следующий месяц"
                      onClick={() => changeMonth(1)}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                <div className={s.grid}>
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
                    <div className={s.weekday} key={d}>
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: offset }, (_, i) => (
                    <div className={s.emptyDay} key={"empty" + i} />
                  ))}
                  {monthDays.map((day) => {
                    const count = countDay(data.events, day),
                      zero = data.zeros.includes(day) && !count;
                    return (
                      <button
                        key={day}
                        disabled={day > today}
                        onClick={() => setSelected(day)}
                        className={[
                          s.day,
                          day === today ? s.current : "",
                          zero ? s.zero : "",
                          count ? s.recorded : "",
                        ].join(" ")}
                      >
                        <span className={s.dayNumber}>
                          {Number(day.slice(-2))}
                        </span>
                        {count ? (
                          <span className={s.dayCount}>
                            {count}
                            <small> сиг.</small>
                          </span>
                        ) : zero ? (
                          <span className={s.zeroLabel}>
                            <Check size={13} />
                            <span>Не курил</span>
                          </span>
                        ) : (
                          <span className={s.noData}>
                            {day > today ? "" : "—"}
                          </span>
                        )}
                        {day === today && <i />}
                      </button>
                    );
                  })}
                </div>
                <div className={s.legend}>
                  <span>
                    <i className={s.dotGreen} /> Не курил
                  </span>
                  <span>
                    <i className={s.dotGray} /> Есть записи
                  </span>
                  <span>— Нет данных</span>
                </div>
              </section>
            ) : (
              <section className={s.statsPanel}>
                <h2>Сигареты по дням</h2>
                <div className={s.chart}>
                  {visibleDays.map((day) => {
                    const c = countDay(data.events, day);
                    return (
                      <div
                        title={`${labelDay(day)}: ${c || (data.zeros.includes(day) ? "0" : "нет данных")}`}
                        key={day}
                      >
                        <span
                          style={{
                            height: Math.max(
                              3,
                              (c /
                                Math.max(
                                  1,
                                  ...visibleDays.map((d) =>
                                    countDay(data.events, d),
                                  ),
                                )) *
                                140,
                            ),
                          }}
                        />
                        <small>{day.slice(-2)}</small>
                      </div>
                    );
                  })}
                </div>
                <div className={s.dayList}>
                  {visibleDays
                    .slice()
                    .reverse()
                    .map((day) => (
                      <div key={day}>
                        <span>{labelDay(day)}</span>
                        <b>
                          {countDay(data.events, day)
                            ? `${countDay(data.events, day)} сиг.`
                            : data.zeros.includes(day)
                              ? "Не курил"
                              : "Нет данных"}
                        </b>
                      </div>
                    ))}
                </div>
              </section>
            )}
            <div className={s.footnote}>
              <Leaf size={17} />
              <p>
                Здесь нет правильных или неправильных цифр.
                <br />
                Только ваши наблюдения и ваш путь.
              </p>
            </div>
          </main>
          <div className={s.actionBar}>
            <span>
              Новая запись<span>Один момент — одно наблюдение</span>
            </span>
            <button className={s.primary} onClick={() => add()}>
              <Plus size={20} /> +1 сигарета
            </button>
          </div>
          {selected && (
            <div
              className={s.overlay}
              onClick={() => {
                setSelected(null);
                setEditing(null);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Записи за день"
                className={s.sheet}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={s.sheetHeader}>
                  <div>
                    <span className={s.eyebrow}>ЗАПИСИ ЗА ДЕНЬ</span>
                    <h2>{labelDay(selected)}</h2>
                  </div>
                  <button
                    aria-label="Закрыть"
                    onClick={() => {
                      setSelected(null);
                      setEditing(null);
                    }}
                  >
                    <X />
                  </button>
                </div>
                <p className={s.dayTotal}>
                  Выкурено: <b>{countDay(data.events, selected)} сигарет</b>
                </p>
                {data.events
                  .filter((e) => e.day === selected)
                  .sort((a, b) => a.at.localeCompare(b.at))
                  .map((e) => (
                    <div className={s.event} key={e.id}>
                      <button onClick={() => openEdit(e)}>
                        {new Date(e.at).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: zone,
                        })}
                        <small>Изменить</small>
                      </button>
                      <button
                        aria-label="Удалить запись"
                        onClick={() => remove(e)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                {!countDay(data.events, selected) && (
                  <p className={s.muted}>
                    {data.zeros.includes(selected)
                      ? "Вы отметили этот день без курения."
                      : "За этот день ещё нет записей."}
                  </p>
                )}
                {editing ? (
                  <form
                    className={s.editForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit();
                    }}
                  >
                    <label>
                      Дата и время ({zone})
                      <input
                        required
                        type="datetime-local"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    </label>
                    <button className={s.primary}>Сохранить</button>
                    <button type="button" onClick={() => setEditing(null)}>
                      Отмена
                    </button>
                  </form>
                ) : (
                  <div className={s.sheetActions}>
                    <button onClick={() => openEdit()}>
                      <Plus size={18} /> Добавить запись
                    </button>
                    {!countDay(data.events, selected) && (
                      <button onClick={() => zero(selected)}>
                        <Check size={18} /> Не курил
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
      {notice && (
        <div className={s.toast} role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
