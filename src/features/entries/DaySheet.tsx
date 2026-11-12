import s from "./DaySheet.module.css";
import { Plus, X, Trash2, Check } from "lucide-react";
import { labelDay } from "../../shared/lib/dates";
import {
  countDay,
  type Data,
  type Entry,
  type SaveEntry,
} from "../../shared/model/tracker";
import { useDialogFocus } from "../../shared/hooks/useDialogFocus";
import { useEntryEditor } from "./useEntryEditor";
type Props = {
  selected: string;
  today: string;
  zone: string;
  data: Data;
  onClose: () => void;
  onSave: SaveEntry;
  onRemove: (entry: Entry) => void;
  onZero: (day: string) => void;
};
export function DaySheet({
  selected,
  today,
  zone,
  data,
  onClose,
  onSave,
  onRemove,
  onZero,
}: Props) {
  useDialogFocus(onClose);
  const { editing, editValue, setEditValue, setEditing, openEdit, saveEdit } =
    useEntryEditor({ selected, today, zone, onSave });
  return (
    <div className={s.overlay} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Записи за день"
        className={s.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.sheetHeader}>
          <div>
            <span className={s.eyebrow}>ЗАПИСИ ЗА ДЕНЬ</span>
            <h2>{labelDay(selected)}</h2>
          </div>
          <button aria-label="Закрыть" onClick={onClose}>
            <X />
          </button>
        </div>
        <p className={s.dayTotal}>
          Выкурено: <b>{countDay(data.events, selected)} сигарет</b>
        </p>
        {data.events
          .filter((e) => e.day === selected)
          .sort((a, b) => a.at.localeCompare(b.at))
          .map((e) => (
            <div className={s.event} key={e.id}>
              <button onClick={() => openEdit(e)}>
                {new Date(e.at).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: zone,
                })}
                <small>Изменить</small>
              </button>
              <button aria-label="Удалить запись" onClick={() => onRemove(e)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        {!countDay(data.events, selected) && (
          <p className={s.muted}>
            {data.zeros.includes(selected)
              ? "Вы отметили этот день без курения."
              : "За этот день ещё нет записей."}
          </p>
        )}
        {editing ? (
          <form
            className={s.editForm}
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
          >
            <label>
              Дата и время ({zone})
              <input
                required
                type="datetime-local"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </label>
            <button className={s.primary}>Сохранить</button>
            <button type="button" onClick={() => setEditing(null)}>
              Отмена
            </button>
          </form>
        ) : (
          <div className={s.sheetActions}>
            <button onClick={() => openEdit()}>
              <Plus size={18} /> Добавить запись
            </button>
            {!countDay(data.events, selected) && (
              <button onClick={() => onZero(selected)}>
                <Check size={18} /> Не курил
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
