const PaymentService = require("../services/paymentService");

exports.createPayment = async (req, res) => {
  try {
    const { planId } = req.body;
    const payment = await PaymentService.createPayment(req.userId, planId);
    res.json(payment);
  } catch (error) {
    console.error("Ошибка создания платежа:", error);
    res.status(500).json({
      message: "Ошибка при создании платежа",
      error: error.message,
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    await PaymentService.handlePaymentWebhook(req.body);
    res.status(200).send();
  } catch (error) {
    console.error("Ошибка обработки webhook:", error);
    res.status(500).send();
  }
};
