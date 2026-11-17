import type { WarehouseCoefficient, WarehouseSettingsItem } from "../../models";
import { escapeHtml } from "../../utils/html";

export type { WarehouseCoefficient };

const keyOf = (
  item: Pick<WarehouseCoefficient, "warehouseID" | "date" | "boxTypeName">,
) => `${item.warehouseID}${item.date}${item.boxTypeName}`;

const sameSlot = (a: WarehouseCoefficient, b: WarehouseCoefficient) =>
  a.date === b.date && a.warehouseID === b.warehouseID && a.boxTypeName === b.boxTypeName;

export interface CoefficientsDiff {
  /** Slots worth a notification: matching the settings and new or changed since last check. */
  toNotify: WarehouseCoefficient[];
  /** Previous coefficient per slot key, for "was xN" in the message. */
  previous: Record<string, number>;
  /** What to remember for the next check; null when nothing changed. */
  nextSnapshot: WarehouseCoefficient[] | null;
}

/**
 * Compares freshly fetched acceptance coefficients with the last snapshot.
 * Pure function: the same rules the monitoring loop used inline, now testable.
 * -1 means "no acceptance"; 0 means free acceptance.
 */
export function diffCoefficients(
  snapshot: readonly WarehouseCoefficient[],
  incoming: readonly WarehouseCoefficient[],
  settings: readonly WarehouseSettingsItem[],
): CoefficientsDiff {
  const settingsById = new Map(settings.map((item) => [item.ID, item]));
  const remembered = snapshot.map((item) => ({ ...item }));
  const previous: Record<string, number> = {};
  const added: WarehouseCoefficient[] = [];
  let changed = false;

  const toNotify = incoming.filter((item) => {
    const wanted = settingsById.get(item.warehouseID);
    if (!wanted) {
      return false; // WB returned a warehouse the user does not watch
    }
    const old = remembered.find((candidate) => sameSlot(candidate, item));
    const date = new Date(item.date);
    const matches =
      item.coefficient > -1 &&
      date >= new Date(wanted.dateStart) &&
      date <= new Date(wanted.dateEnd) &&
      wanted.boxTypes.includes(item.boxTypeName) &&
      item.coefficient <= wanted.coeff &&
      (old ? item.coefficient !== old.coefficient : true);

    if (matches && !old) {
      added.push(item);
    }
    if (old && old.coefficient !== item.coefficient) {
      previous[keyOf(item)] = old.coefficient;
      old.coefficient = item.coefficient;
      changed = true;
    }
    return matches;
  });

  let nextSnapshot: WarehouseCoefficient[] = [];
  if (!remembered.length) {
    nextSnapshot = toNotify;
  }
  if (changed) {
    nextSnapshot = remembered;
  }
  if (added.length && remembered.length) {
    nextSnapshot = [...(nextSnapshot.length ? nextSnapshot : remembered), ...added];
  }

  return { toNotify, previous, nextSnapshot: nextSnapshot.length ? nextSnapshot : null };
}

const formatCoefficient = (value: number) =>
  value === 0 ? "<b>бесплатно</b>" : value === -1 ? "нет приёмки" : `x${value}`;

/**
 * One HTML block per slot for a Telegram message (parse_mode HTML).
 * Warehouse and box names come from WB and are escaped.
 */
export function formatCoefficientBlocks(
  items: readonly WarehouseCoefficient[],
  previous: Record<string, number>,
): string[] {
  return items.map((item) => {
    const old = previous[keyOf(item)];
    const date = item.date.split("T")[0]?.split("-").reverse().join(".");
    return (
      `Склад: ${escapeHtml(item.warehouseName)}\n🗓: ${escapeHtml(date)}\n` +
      `Тип упаковки: ${escapeHtml(item.boxTypeName)}\n` +
      `Коэффициент: ${formatCoefficient(item.coefficient)}` +
      (old !== undefined ? `\nПрошлый коэффициент: ${formatCoefficient(old)}` : "") +
      "\n\n"
    );
  });
}
