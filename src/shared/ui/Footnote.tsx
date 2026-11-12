import s from "./Footnote.module.css";
import { Leaf } from "lucide-react";
export function Footnote() {
  return (
    <div className={s.footnote}>
      <Leaf size={17} />
      <p>
        Здесь нет правильных или неправильных цифр.
        <br />
        Только ваши наблюдения и ваш путь.
      </p>
    </div>
  );
}
