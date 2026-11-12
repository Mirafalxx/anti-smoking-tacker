import s from "./StatisticsFilters.module.css";
import { dayKey } from "../../shared/lib/dates";
import type { DateRange } from "../../shared/model/tracker";
type Props = {
  range: DateRange;
  today: string;
  onChange: (range: DateRange) => void;
};
export function StatisticsFilters({ range, today, onChange }: Props) {
  function preset(n: number) {
    const date = new Date(today + "T12:00:00");
    date.setDate(date.getDate() - n + 1);
    onChange({ start: dayKey(date), end: today });
  }
  return (
    <section className={s.filters}>
      <div className={s.presets}>
        <button
          onClick={() => {
            const d = new Date();
            onChange({
              start: dayKey(new Date(d.getFullYear(), d.getMonth(), 1, 12)),
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
            e.target.value && onChange({ ...range, start: e.target.value })
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
            e.target.value && onChange({ ...range, end: e.target.value })
          }
        />
      </label>
    </section>
  );
}
