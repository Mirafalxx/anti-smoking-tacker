import { describe, it, expect } from "vitest";
import { daysBetween, dayKey } from "./dates";
import { countDay, type Entry } from "../model/tracker";
import { wallTimeToIso } from "./dates";

describe("Редактирование времени в часовом поясе аккаунта", () => {
  it("конвертирует Бишкек независимо от часового пояса устройства", () => {
    expect(wallTimeToIso("2026-11-12T01:30", "Asia/Bishkek")).toBe(
      "2026-11-11T19:30:00.000Z",
    );
  });
  it("учитывает переход через полночь в отрицательном смещении", () => {
    expect(wallTimeToIso("2026-11-11T23:30", "America/New_York")).toBe(
      "2026-11-12T04:30:00.000Z",
    );
  });
  it("не сохраняет невалидное значение поля времени", () => {
    expect(wallTimeToIso("", "Asia/Bishkek")).toBeNull();
  });
});
describe("Даты и подсчёт", () => {
  it("включает обе границы и високосный день", () =>
    expect(daysBetween("2024-02-28", "2024-03-01")).toEqual([
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
    ]));
  it("учитывает полночь в часовом поясе профиля", () =>
    expect(dayKey(new Date("2026-11-11T20:00:00Z"), "Asia/Bishkek")).toBe(
      "2026-11-12",
    ));
  it("возвращает пустой список для обратного диапазона", () =>
    expect(daysBetween("2026-12-01", "2026-11-30")).toEqual([]));
  it("считает пять записей, удаление и перенос", () => {
    const e: Entry[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      at: "",
      createdAt: "",
      day: "2026-11-11",
    }));
    expect(countDay(e, "2026-11-11")).toBe(5);
    expect(countDay(e.slice(1), "2026-11-11")).toBe(4);
    e[0].day = "2026-11-12";
    expect(countDay(e, "2026-11-11")).toBe(4);
    expect(countDay(e, "2026-11-12")).toBe(1);
  });
});
