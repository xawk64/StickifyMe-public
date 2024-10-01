export enum ApiUrlEnum {
  authSignup = "/auth/signup",
  authSignin = "/auth/signin",
  authVerify = "/auth/verify",
  authMe = "/auth/me",
  generateBarcode = "/barcodes/generate",
  getBarcodesHistory = "/barcodes/history",
  addBarcodesHistory = "/barcodes-history/add",
  wbGetProduct = "https://content-api.wildberries.ru/content/v2/get/cards/list?locale=ru",
  wbGetOrders = "https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=0&dateFrom=1726837284&dateTo=",
  wbGetOrdersStatuses = "https://marketplace-api.wildberries.ru/api/v3/orders/status",
  setWarehousesSettings = "/warehouses/settings",
}
