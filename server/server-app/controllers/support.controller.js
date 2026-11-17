const db = require("../models");
const User = db.user;
const Feedback = db.feedback;
const { sendEmail } = require("../utils/sendEmail");
const config = require("../config");

exports.sendFeedback = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    const feedback = new Feedback({
      message: req.body.message,
      type: req.body.type,
      userId: user._id,
      userEmail: user.email,
    });

    await feedback.save();

    // Отправляем уведомление администратору
    await sendEmail(
      config.adminEmail,
      `Новое обращение: ${req.body.type}`,
      `От пользователя: ${user.email}\nТип: ${req.body.type}\nСообщение: ${req.body.message}`,
    );

    res.status(200).send({ message: "Сообщение успешно отправлено" });
  } catch (error) {
    console.error("Ошибка при отправке обращения:", error);
    res.status(500).send({ message: "Произошла ошибка при обработке запроса" });
  }
};
