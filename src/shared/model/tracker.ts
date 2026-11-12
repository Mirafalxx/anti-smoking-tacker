export type Entry = { id: string; day: string; at: string; createdAt: string };
export type Data = { events: Entry[]; zeros: string[] };
export type DateRange = { start: string; end: string };
export type TrackerView = "calendar" | "stats";
export type SaveEntry = (
  at?: string,
  id?: string,
  createdAt?: string,
) => boolean;
export const emptyData = (): Data => ({ events: [], zeros: [] });
export const countDay = (events: Entry[], day: string) =>
  events.filter((e) => e.day === day).length;
