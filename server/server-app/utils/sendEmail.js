const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Mail.ru",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (email, subject, htmlMessage) => {
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

module.exports = { sendEmail, transporter };
