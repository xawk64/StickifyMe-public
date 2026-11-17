const nodemailer = require("nodemailer");
const config = require("../config");

// Without SMTP settings (local run, demo, tests) emails are logged instead of sent.
const transporter = config.mail.host
  ? nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: {
        user: config.mail.user,
        pass: config.mail.password,
      },
    })
  : null;

const sendEmail = async (email, subject, htmlMessage) => {
  if (!email) {
    return;
  }
  if (!transporter) {
    console.log(`[mail:dry-run] to=${email} subject="${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({
      from: config.mail.from,
      to: email,
      subject: subject,
      html: htmlMessage,
    });
  } catch (e) {
    console.error(e);
  }
};

const verifyMailTransport = async () => {
  if (!transporter) {
    console.log("SMTP is not configured, emails will be logged only");
    return;
  }
  try {
    await transporter.verify();
    console.log("SMTP server is ready to send messages");
  } catch (error) {
    console.error("SMTP connection error:", error);
  }
};

module.exports = { sendEmail, verifyMailTransport };
