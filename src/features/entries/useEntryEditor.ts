import { useState } from "react";
import type { Entry, SaveEntry } from "../../shared/model/tracker";
import { wallTimeToIso } from "../../shared/lib/dates";
export function useEntryEditor({
  selected,
  today,
  zone,
  onSave,
}: {
  selected: string;
  today: string;
  zone: string;
  onSave: SaveEntry;
}) {
  const [editing, setEditing] = useState<Entry | null>(null),
    [editValue, setEditValue] = useState("");
  function openEdit(e?: Entry) {
    const date = e
      ? new Date(e.at)
      : new Date((selected || today) + "T12:00:00");
    setEditing(
      e || {
        id: crypto.randomUUID(),
        day: selected || today,
        at: "",
        createdAt: "",
      },
    );
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    setEditValue(
      e
        ? parts.replace(" ", "T")
        : `${selected || today}T${selected === today ? new Intl.DateTimeFormat("sv-SE", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()) : "12:00"}`,
    );
  }
  function saveEdit() {
    const instant = wallTimeToIso(editValue, zone);
    if (!instant) return;
    if (
      editing &&
      onSave(instant, editing.id, editing.createdAt || new Date().toISOString())
    )
      setEditing(null);
  }

  return { editing, editValue, setEditValue, setEditing, openEdit, saveEdit };
}
