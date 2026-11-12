import s from "./QuickAddBar.module.css";
import { Plus } from "lucide-react";
export function QuickAddBar({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={s.actionBar}>
      <span>
        Новая запись<span>Один момент — одно наблюдение</span>
      </span>
      <button className={s.primary} onClick={onAdd}>
        <Plus size={20} /> +1 сигарета
      </button>
    </div>
  );
}
