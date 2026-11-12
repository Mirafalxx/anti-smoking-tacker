import s from "./StatisticsPanel.module.css";
import { daysBetween, labelDay } from "../../shared/lib/dates";
import { countDay, type Data } from "../../shared/model/tracker";
type Props = { data: Data; start: string; end: string };
export function StatisticsPanel({ data, start, end }: Props) {
  const visibleDays = daysBetween(start, end);
  return (
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
                        ...visibleDays.map((d) => countDay(data.events, d)),
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
  );
}
