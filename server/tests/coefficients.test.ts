import { describe, expect, it } from "vitest";

import {
  diffCoefficients,
  formatCoefficientBlocks,
  type WarehouseCoefficient,
} from "../src/services/monitoring/coefficients";
import { TELEGRAM_MESSAGE_LIMIT, splitMessage } from "../src/telegram/message";

const settings = [
  {
    ID: 1,
    boxTypes: ["Короба"],
    coeff: 2,
    dateStart: new Date("2024-10-01"),
    dateEnd: new Date("2024-10-10"),
  },
];

const slot = (overrides: Partial<WarehouseCoefficient> = {}) => ({
  date: "2024-10-05T00:00:00Z",
  coefficient: 1,
  warehouseID: 1,
  warehouseName: "Коледино",
  boxTypeName: "Короба",
  ...overrides,
});

describe("diffCoefficients", () => {
  it("notifies about a matching slot seen for the first time and remembers it", () => {
    const result = diffCoefficients([], [slot()], settings);
    expect(result.toNotify).toEqual([slot()]);
    expect(result.nextSnapshot).toEqual([slot()]);
  });

  it.each([
    ["no acceptance (-1)", slot({ coefficient: -1 })],
    ["coefficient above the limit", slot({ coefficient: 3 })],
    ["date outside the range", slot({ date: "2024-11-01T00:00:00Z" })],
    ["another box type", slot({ boxTypeName: "Монопаллеты" })],
    ["a warehouse the user does not watch", slot({ warehouseID: 99 })],
  ])("ignores %s", (_name, item) => {
    const result = diffCoefficients([], [item], settings);
    expect(result.toNotify).toEqual([]);
    expect(result.nextSnapshot).toBeNull();
  });

  it("does not repeat a notification while the coefficient stays the same", () => {
    const result = diffCoefficients([slot()], [slot()], settings);
    expect(result.toNotify).toEqual([]);
    expect(result.nextSnapshot).toBeNull();
  });

  it("notifies about a changed coefficient and reports the previous value", () => {
    const result = diffCoefficients(
      [slot({ coefficient: 2 })],
      [slot({ coefficient: 0 })],
      settings,
    );
    expect(result.toNotify).toEqual([slot({ coefficient: 0 })]);
    expect(result.previous).toEqual({ "12024-10-05T00:00:00ZКороба": 2 });
    expect(result.nextSnapshot).toEqual([slot({ coefficient: 0 })]);
  });

  it("does not mutate the snapshot passed in", () => {
    const snapshot = [slot({ coefficient: 2 })];
    diffCoefficients(snapshot, [slot({ coefficient: 0 })], settings);
    expect(snapshot[0]?.coefficient).toBe(2);
  });
});

describe("formatCoefficientBlocks", () => {
  it("renders free acceptance and the previous coefficient", () => {
    const [text] = formatCoefficientBlocks([slot({ coefficient: 0 })], {
      "12024-10-05T00:00:00ZКороба": 2,
    });
    expect(text).toContain("Склад: Коледино");
    expect(text).toContain("🗓: 05.10.2024");
    expect(text).toContain("Коэффициент: <b>бесплатно</b>");
    expect(text).toContain("Прошлый коэффициент: x2");
  });

  it("escapes names coming from WB for Telegram HTML", () => {
    const [text] = formatCoefficientBlocks([slot({ warehouseName: "Склад <A&B>" })], {});
    expect(text).toContain("Склад &lt;A&amp;B&gt;");
  });
});

describe("splitMessage", () => {
  it("keeps every message within the Telegram limit without cutting a block", () => {
    const blocks = Array.from({ length: 300 }, (_, i) =>
      formatCoefficientBlocks([slot({ warehouseName: `Склад ${i}` })], {}).join(""),
    );
    const messages = splitMessage(blocks);
    expect(messages.length).toBeGreaterThan(1);
    expect(messages.every((m) => m.length <= TELEGRAM_MESSAGE_LIMIT)).toBe(true);
    expect(messages.join("")).toBe(blocks.join(""));
  });

  it("cuts a single oversized block", () => {
    expect(splitMessage(["x".repeat(5000)]).map((m) => m.length)).toEqual([4096, 904]);
  });
});
