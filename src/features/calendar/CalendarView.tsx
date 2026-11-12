import s from "./CalendarView.module.css";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { dayKey, daysBetween } from "../../shared/lib/dates";
import { countDay, type Data } from "../../shared/model/tracker";
type Props = {
  data: Data;
  today: string;
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (day: string) => void;
};
export function CalendarView({
  data,
  today,
  month,
  onMonthChange,
  onSelect,
}: Props) {
  const monthStart = dayKey(
    new Date(month.getFullYear(), month.getMonth(), 1, 12),
  );
  const monthEnd = dayKey(
    new Date(month.getFullYear(), month.getMonth() + 1, 0, 12),
  );
  const monthDays = daysBetween(monthStart, monthEnd),
    offset =
      (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const changeMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return (
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
              onMonthChange(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              )
            }
          >
            Сегодня
          </button>
          <button aria-label="Предыдущий месяц" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <button aria-label="Следующий месяц" onClick={() => changeMonth(1)}>
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
              onClick={() => onSelect(day)}
              className={[
                s.day,
                day === today ? s.current : "",
                zero ? s.zero : "",
                count ? s.recorded : "",
              ].join(" ")}
            >
              <span className={s.dayNumber}>{Number(day.slice(-2))}</span>
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
                <span className={s.noData}>{day > today ? "" : "—"}</span>
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
  );
}
