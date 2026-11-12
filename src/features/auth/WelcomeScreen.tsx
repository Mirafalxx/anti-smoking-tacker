import s from "./WelcomeScreen.module.css";
import {
  CalendarDays,
  ChartNoAxesCombined,
  WifiOff,
  ArrowUpRight,
} from "lucide-react";
import { configured } from "../../shared/lib/firebase";
type Props = { busy: boolean; onSignIn: () => void; onDemo: () => void };
export function WelcomeScreen({ busy, onSignIn, onDemo }: Props) {
  return (
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
        disabled={!configured || busy}
        onClick={onSignIn}
      >
        Войти через Google <ArrowUpRight size={18} />
      </button>
      {!configured && (
        <small>
          Для входа необходимо подключить Firebase. Инструкция — в README.
        </small>
      )}
      <button className={s.textButton} onClick={onDemo}>
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
  );
}
