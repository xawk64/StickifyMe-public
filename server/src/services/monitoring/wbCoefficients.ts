import type { WarehouseCoefficient } from "./coefficients";

const COEFFICIENTS_URL =
  "https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients";

export type FetchCoefficients = (
  apiKey: string,
  warehouseIds: number[],
) => Promise<WarehouseCoefficient[]>;

/**
 * Loads acceptance coefficients from the WB supplies API.
 * Throws on network errors and on an error payload ({ detail }) from WB.
 */
export const fetchCoefficients: FetchCoefficients = async (apiKey, warehouseIds) => {
  const response = await fetch(
    `${COEFFICIENTS_URL}?warehouseIDs=${warehouseIds.join(",")}`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
    },
  );
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    const detail = (payload as { detail?: unknown } | null)?.detail;
    throw new Error(`WB coefficients error: ${String(detail ?? response.status)}`);
  }
  return payload as WarehouseCoefficient[];
};
