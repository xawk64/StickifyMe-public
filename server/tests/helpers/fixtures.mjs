// 1x1 PNG, stands in for the sticker image returned by the WB API
export const PNG_1PX_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export function makeOrder(index = 1, overrides = {}) {
  return {
    id: 1000 + index,
    nmId: 2000 + index,
    createdAtMarket: "2024-10-01T10:00:00Z",
    deliveryType: "fbs",
    stickersCount: 1,
    bcUp: "123456",
    bcDown: "7890",
    barcode: "*AbCdEf",
    barcodeFile: PNG_1PX_BASE64,
    product: {
      id: 2000 + index,
      barcode: "4006381333931",
      title: `Product ${index}`,
      vendorCode: `VC-${index}`,
      brand: "Brand",
      characteristics: { Цвет: ["красный"], "Страна производства": ["Россия"] },
    },
    ...overrides,
  };
}
