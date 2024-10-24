const nodemailer = require("nodemailer");

exports.sendEmail = async (email, subject, htmlMessage) => {
  let transporter = nodemailer.createTransport({
    service: "Mail.ru",
    auth: {
      user: "support@example.com",
      pass: "pJZQijvcV0b0UD2A2iji",
    },
  });

  try {
    let result = await transporter.sendMail({
      from: '"Сервис example.com" <support@example.com>',
      to: email,
      subject: subject,
      html: htmlMessage,
    });
    console.log(result);
  } catch (e) {
    console.error(e);
  }
};
