import s from "./App.module.css";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "../features/auth/useSession";
import { WelcomeScreen } from "../features/auth/WelcomeScreen";
import { useTrackerData } from "../features/tracking/useTrackerData";
import { useTrackerNavigation } from "./useTrackerNavigation";
import { AppHeader } from "./components/AppHeader";
import { PageHeader } from "./components/PageHeader";
import { CalendarView } from "../features/calendar/CalendarView";
import { StatisticsFilters } from "../features/statistics/StatisticsFilters";
import { StatisticsPanel } from "../features/statistics/StatisticsPanel";
import { SummaryCards } from "../features/statistics/SummaryCards";
import { DaySheet } from "../features/entries/DaySheet";
import { QuickAddBar } from "../features/entries/QuickAddBar";
import { Feedback } from "../shared/ui/Feedback";
import { Footnote } from "../shared/ui/Footnote";
import { Leaf } from "lucide-react";
export function App() {
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const session = useSession(setError);
  const navigation = useTrackerNavigation(session.zone);
  const tracker = useTrackerData({
    user: session.user,
    zone: session.zone,
    start: navigation.start,
    end: navigation.end,
    online: navigation.online,
    onError: setError,
    onNotice: setNotice,
  });
  const closeDay = useCallback(() => setSelected(null), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const navigate = (view: typeof navigation.view) => {
    navigation.go(view);
    closeDay();
  };
  const logout = () => {
    if (tracker.demo) tracker.exitDemo();
    else void session.logout(tracker.pending, navigation.online);
  };
  return (
    <div className={s.app}>
      <AppHeader
        user={session.user}
        online={navigation.online}
        pending={tracker.pending}
        demo={tracker.demo}
        zone={session.zone}
        onHome={() => navigate("calendar")}
        onLogout={logout}
      />
      <Feedback
        error={error}
        notice={notice}
        onDismissError={() => setError("")}
      />
      {!session.ready ? (
        <main className={s.welcome}>
          <Leaf />
          <h1>Загружаем ваш календарь…</h1>
        </main>
      ) : !session.user && !tracker.demo ? (
        <WelcomeScreen
          busy={session.authBusy}
          onSignIn={session.signIn}
          onDemo={tracker.enterDemo}
        />
      ) : (
        <>
          <main className={s.main}>
            <PageHeader
              view={navigation.view}
              zone={session.zone}
              onNavigate={navigate}
            />
            {tracker.demo && (
              <div className={s.demo}>
                Деморежим · записи сохраняются только на этом устройстве
              </div>
            )}
            {!tracker.demo && (tracker.cached || !navigation.online) && (
              <div className={s.demo}>
                Данные из кеша могут быть неполными.{" "}
                {tracker.pending
                  ? "Изменения ожидают отправки."
                  : "Полная статистика доступна после соединения с сервером."}
              </div>
            )}
            {navigation.view === "stats" && (
              <StatisticsFilters
                range={navigation.range}
                today={navigation.today}
                onChange={navigation.setRange}
              />
            )}
            <SummaryCards
              data={tracker.data}
              view={navigation.view}
              today={navigation.today}
              start={navigation.start}
              end={navigation.end}
            />
            {navigation.view === "calendar" ? (
              <CalendarView
                data={tracker.data}
                today={navigation.today}
                month={navigation.month}
                onMonthChange={navigation.setMonth}
                onSelect={setSelected}
              />
            ) : (
              <StatisticsPanel
                data={tracker.data}
                start={navigation.start}
                end={navigation.end}
              />
            )}
            <Footnote />
          </main>
          <QuickAddBar onAdd={() => tracker.add()} />
          {selected && (
            <DaySheet
              key={selected}
              selected={selected}
              today={navigation.today}
              zone={session.zone}
              data={tracker.data}
              onClose={closeDay}
              onSave={tracker.add}
              onRemove={tracker.remove}
              onZero={tracker.zero}
            />
          )}
        </>
      )}
    </div>
  );
}
