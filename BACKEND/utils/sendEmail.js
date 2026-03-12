const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendOtpEmail(to, otp) {
    const mailOptions = {
        from: `"SeekhoBharat" <${process.env.SMTP_USER}>`,
        to,
        subject: "Password Reset OTP - SeekhoBharat",
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; border-radius: 16px; color: #e0e0e0;">
        <h2 style="color: #7c5cfc; margin: 0 0 8px;">SeekhoBharat</h2>
        <p style="margin: 0 0 24px; color: #aaa; font-size: 14px;">Password Reset Request</p>
        <p style="margin: 0 0 16px;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #16213e; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #7c5cfc;">
          ${otp}
        </div>
        <p style="margin: 0; color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
