import { useEffect } from "react";

export function useDialogFocus(onClose: () => void) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.querySelector<HTMLElement>("button, input")?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)") || []);
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [onClose]);
}
