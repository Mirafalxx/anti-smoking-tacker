import s from "./Feedback.module.css";
import { Check, X } from "lucide-react";
export function Feedback({
  error,
  notice,
  onDismissError,
}: {
  error: string;
  notice: string;
  onDismissError: () => void;
}) {
  return (
    <>
      {error && (
        <div role="alert" className={s.error}>
          {error}
          <button aria-label="Закрыть ошибку" onClick={onDismissError}>
            <X size={18} />
          </button>
        </div>
      )}
      {notice && (
        <div className={s.toast} role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
    </>
  );
}
