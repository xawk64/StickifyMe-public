// Deterministic demo data shaped like the Wildberries seller API responses.

export const DEMO_API_KEY = "demo-wb-api-key";

const PRODUCTS = [
  {
    title: "Футболка оверсайз хлопок",
    subject: "Футболки",
    brand: "NordWear",
    color: "чёрный",
    size: "M",
  },
  {
    title: "Худи с капюшоном утеплённое",
    subject: "Худи",
    brand: "NordWear",
    color: "серый",
    size: "L",
  },
  {
    title: "Кружка керамическая 350 мл",
    subject: "Кружки",
    brand: "HomeCraft",
    color: "белый",
    size: "0",
  },
  {
    title: "Чехол для смартфона силиконовый",
    subject: "Чехлы",
    brand: "CaseLab",
    color: "прозрачный",
    size: "0",
  },
  {
    title: "Носки спортивные, 5 пар",
    subject: "Носки",
    brand: "FitStep",
    color: "белый",
    size: "41-45",
  },
  {
    title: "Рюкзак городской 20 л",
    subject: "Рюкзаки",
    brand: "UrbanGo",
    color: "синий",
    size: "0",
  },
];

/** EAN-13 with a valid check digit. */
function ean13(seed: number): string {
  const base = `460${String(1000000000 + seed * 7919).slice(-9)}`;
  const sum = [...base].reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0);
  return base + ((10 - (sum % 10)) % 10);
}

export const cards = PRODUCTS.map((p, i) => {
  const nmID = 180_000_000 + i * 1371;
  return {
    nmID,
    vendorCode: `ART-${1001 + i}`,
    brand: p.brand,
    title: p.title,
    description: `${p.title}. Демонстрационная карточка товара.`,
    subjectName: p.subject,
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-10-01T10:00:00Z",
    characteristics: [
      { id: 1, name: "Цвет", value: [p.color] },
      { id: 2, name: "Размер", value: [p.size] },
      { id: 3, name: "Страна производства", value: ["Россия"] },
    ],
    sizes: [{ skus: [ean13(i + 1)] }],
  };
});

/** 24 FBS orders spread over the last days; most are "in assembly" (confirm). */
export function orders(now = Date.now()) {
  return Array.from({ length: 24 }, (_, i) => ({
    id: 3_100_000_000 + i * 17,
    nmId: cards[i % cards.length]!.nmID,
    createdAt: new Date(now - i * 3 * 60 * 60 * 1000).toISOString(),
    deliveryType: "fbs",
    article: cards[i % cards.length]!.vendorCode,
  }));
}

export const statusOf = (orderId: number) =>
  (orderId / 17) % 5 === 4 ? "complete" : "confirm";

export const WAREHOUSES = [
  { ID: 507, name: "Коледино", address: "Московская обл., д. Коледино" },
  { ID: 117986, name: "Казань", address: "Республика Татарстан, Зеленодольский р-н" },
  { ID: 686, name: "Новосибирск", address: "Новосибирск, Петухова ул." },
  { ID: 1733, name: "Екатеринбург - Испытателей 14г", address: "Екатеринбург" },
];

const BOX_TYPES = ["Короба", "Монопаллеты", "Суперсейф"];

/**
 * Acceptance coefficients for the next 14 days. Values change every
 * `periodMs` so that the monitoring demo has something to report.
 */
export function coefficients(
  warehouseIds: number[],
  now = Date.now(),
  periodMs = 60_000,
) {
  const tick = Math.floor(now / periodMs);
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return warehouseIds.flatMap((warehouseID) => {
    const warehouse = WAREHOUSES.find((w) => w.ID === warehouseID);
    if (!warehouse) return [];
    return Array.from({ length: 14 }, (_, day) =>
      BOX_TYPES.map((boxTypeName, boxIndex) => {
        const pseudo = (warehouseID * 31 + day * 7 + boxIndex * 13 + tick * 11) % 23;
        return {
          date: new Date(today.getTime() + day * 86_400_000)
            .toISOString()
            .replace(".000Z", "Z"),
          coefficient: pseudo < 4 ? -1 : pseudo % 6, // -1 = no acceptance, 0 = free
          warehouseID,
          warehouseName: warehouse.name,
          boxTypeName,
          boxTypeID: boxIndex + 2,
        };
      }),
    ).flat();
  });
}
