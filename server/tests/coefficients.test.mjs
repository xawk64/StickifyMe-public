import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  diffCoefficients,
  formatCoefficientsMessage,
} = require("../dist/services/monitoring/coefficients");

const settings = [
  {
    ID: 1,
    boxTypes: ["Короба"],
    coeff: 2,
    dateStart: new Date("2024-10-01"),
    dateEnd: new Date("2024-10-10"),
  },
];

const slot = (overrides = {}) => ({
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
    expect(snapshot[0].coefficient).toBe(2);
  });
});

describe("formatCoefficientsMessage", () => {
  it("renders free acceptance and the previous coefficient", () => {
    const text = formatCoefficientsMessage([slot({ coefficient: 0 })], {
      "12024-10-05T00:00:00ZКороба": 2,
    });
    expect(text).toContain("Склад: Коледино");
    expect(text).toContain("🗓: 05.10.2024");
    expect(text).toContain("Коэффициент: `бесплатно`");
    expect(text).toContain("Прошлый коэффициент: x2");
  });
});
