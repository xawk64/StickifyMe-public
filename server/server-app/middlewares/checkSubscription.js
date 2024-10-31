const db = require("../models");
const UserSubscription = db.userSubscription;

const checkSubscription = (marketplaceType) => {
  return async (req, res, next) => {
    try {
      const subscription = await UserSubscription.findOne({
        userId: req.userId,
        type: marketplaceType,
        isActive: true,
        endDate: { $gt: new Date() },
      });

      if (!subscription) {
        return res.status(403).send({
          message:
            "Требуется активная подписка для доступа к этому функционалу",
        });
      }
      next();
    } catch (error) {
      return res.status(500).send({
        message: "Ошибка при проверке подписки",
      });
    }
  };
};

module.exports = checkSubscription;
