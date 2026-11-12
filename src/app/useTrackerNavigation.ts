import { useEffect, useState } from "react";
import { dayKey } from "../shared/lib/dates";
import type { DateRange, TrackerView } from "../shared/model/tracker";
const currentView = (): TrackerView =>
  location.hash === "#/stats" ? "stats" : "calendar";
export function useTrackerNavigation(zone: string) {
  const [view, setView] = useState<TrackerView>(currentView);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [online, setOnline] = useState(navigator.onLine);
  const today = dayKey(new Date(), zone);
  const monthStart = dayKey(
    new Date(month.getFullYear(), month.getMonth(), 1, 12),
  );
  const monthEnd = dayKey(
    new Date(month.getFullYear(), month.getMonth() + 1, 0, 12),
  );
  const [range, setRange] = useState<DateRange>({
    start: monthStart,
    end: today,
  });
  useEffect(() => {
    const change = () => setView(currentView());
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
  function go(view: TrackerView) {
    location.hash = view === "stats" ? "/stats" : "/";
    setView(view);
  }
  return {
    view,
    month,
    setMonth,
    range,
    setRange,
    online,
    today,
    start: view === "stats" ? range.start : monthStart,
    end: view === "stats" ? range.end : monthEnd,
    go,
  };
}
