const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use App Password, not real password
  },
});

exports.sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.BASE_URL}/auth/verify/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Stock Screener App',
    html: `
      <h3>Welcome!</h3>
      <p>Please click the link below to verify your account:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};