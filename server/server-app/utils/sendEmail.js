const nodemailer = require("nodemailer");

exports.sendEmail = async (email, username, hash) => {
  let transporter = nodemailer.createTransport({
    service: "Mail.ru",
    auth: {
      user: "support@example.com",
      pass: "pJZQijvcV0b0UD2A2iji",
    },
  });

  try {
    let result = await transporter.sendMail({
      from: '"Сервис BarcodeBerries" <support@example.com>',
      to: email,
      subject: "Потверждение учетной записи",
      html: `Добрый день, ${username}! <br />Вы зарегистрировались на сервисе BarcodeBerries. Для подтверждения почты перейдите по ссылке:  <a href="https:/barcodeberries.ru/verify/?hash=${hash}">подтвердить регистрацию</a> или введите вручную в браузере: localhost:3000/verify/?hash=${hash}.Если это делали не Вы, просьба закрыть данное сообщение. `,
    });
    console.log(result);
  } catch (e) {
    console.error(e);
  }
};
