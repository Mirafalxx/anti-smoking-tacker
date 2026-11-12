import s from "./SummaryCards.module.css";
import {
  countDay,
  type Data,
  type TrackerView,
} from "../../shared/model/tracker";
type Props = {
  data: Data;
  view: TrackerView;
  today: string;
  start: string;
  end: string;
};
export function SummaryCards({ data, view, today, start, end }: Props) {
  const total = data.events.filter(
    (e) => e.day >= start && e.day <= end,
  ).length;
  const confirmed = data.zeros.filter(
    (d) => d >= start && d <= end && !countDay(data.events, d),
  ).length;
  return (
    <div className={s.summary}>
      <article>
        <span>
          {view === "calendar" ? "Сигарет за месяц" : "Сигарет за период"}
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
          {today >= start && today <= end ? countDay(data.events, today) : "—"}
          <small> шт.</small>
        </strong>
        <p>Отмечайте сразу после курения</p>
      </article>
    </div>
  );
}
