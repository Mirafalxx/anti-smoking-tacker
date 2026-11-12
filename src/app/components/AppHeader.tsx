import s from "./AppHeader.module.css";
import { useState } from "react";
import { Leaf, WifiOff, LogOut } from "lucide-react";
type Props = {
  user: { displayName: string | null; email: string | null } | null;
  online: boolean;
  pending: boolean;
  demo: boolean;
  zone: string;
  onHome: () => void;
  onLogout: () => void;
};
export function AppHeader({
  user,
  online,
  pending,
  demo,
  zone,
  onHome,
  onLogout,
}: Props) {
  const [profile, setProfile] = useState(false);
  return (
    <>
      <header className={s.header}>
        <a className={s.brand} href="#/" onClick={onHome}>
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
            onClick={() => {
              onLogout();
              setProfile(false);
            }}
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      )}
    </>
  );
}
