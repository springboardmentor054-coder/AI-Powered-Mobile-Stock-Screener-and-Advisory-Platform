const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class EmailService {
  async sendAlertActivationEmail(email, userName) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Stock Alerts Activated",
      text: `Hi ${userName}, your stock alerts have been activated.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Activation email sent to", email);
    } catch (error) {
      console.error("Error sending activation email:", error);
    }
  }

  async sendDailyNewsAlert(email, userName, newsArticles) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Daily Stock News Alert",
      text: `Hi ${userName}, here are today's stock news: ${newsArticles.map((a) => a.title).join(", ")}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Daily news email sent to", email);
    } catch (error) {
      console.error("Error sending daily news email:", error);
    }
  }
}

module.exports = new EmailService();
