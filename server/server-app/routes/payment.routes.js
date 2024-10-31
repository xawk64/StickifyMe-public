const { authJwt } = require("../middlewares");
const controller = require("../controllers/payment.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Создание платежа
  app.post(
    "/api/payments/create",
    [authJwt.verifyToken],
    controller.createPayment
  );

  // Webhook для обработки уведомлений от платежной системы
  app.post("/api/payments/webhook", controller.handleWebhook);
};
