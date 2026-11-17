const db = require("../models");
const User = db.user;
const Feedback = db.feedback;
const { notifyAdmin } = require("../utils/sendEmail");
const templates = require("../emails/templates");

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
    await notifyAdmin(
      templates.adminSupportRequest({
        email: user.email,
        type: req.body.type,
        message: req.body.message,
      }),
    );

    res.status(200).send({ message: "Сообщение успешно отправлено" });
  } catch (error) {
    console.error("Ошибка при отправке обращения:", error);
    res.status(500).send({ message: "Произошла ошибка при обработке запроса" });
  }
};
