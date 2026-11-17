const nodemailer = require("nodemailer");
const config = require("../config");

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.port === 465,
  auth: {
    user: config.mail.user,
    pass: config.mail.password,
  },
});

const sendEmail = async (email, subject, htmlMessage) => {
  try {
    let result = await transporter.sendMail({
      from: config.mail.from,
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
