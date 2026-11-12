import s from "./PageHeader.module.css";
import { CalendarDays, ChartNoAxesCombined } from "lucide-react";
import type { TrackerView } from "../../shared/model/tracker";
export function PageHeader({
  view,
  zone,
  onNavigate,
}: {
  view: TrackerView;
  zone: string;
  onNavigate: (view: TrackerView) => void;
}) {
  return (
    <>
      <div className={s.pageHeading}>
        <div>
          <span className={s.eyebrow}>ДЕНЬ ЗА ДНЁМ</span>
          <h1>{view === "calendar" ? "Ваш календарь" : "Ваша статистика"}</h1>
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
          onClick={() => onNavigate("calendar")}
        >
          <CalendarDays size={17} /> Календарь
        </button>
        <button
          className={view === "stats" ? s.tabActive : ""}
          onClick={() => onNavigate("stats")}
        >
          <ChartNoAxesCombined size={18} /> Статистика
        </button>
      </nav>
    </>
  );
}
