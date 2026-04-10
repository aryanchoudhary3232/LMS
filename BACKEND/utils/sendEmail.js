const nodemailer = require("nodemailer");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

async function sendCoursePurchaseConfirmationEmail(to, payload = {}) {
    const {
        studentName = "Student",
        courses = [],
        totalAmount = 0,
        purchasedAt = new Date(),
    } = payload;

    const safeCourses = Array.isArray(courses) ? courses : [];
    const purchaseDate = new Date(purchasedAt);
    const formattedPurchaseDate = Number.isNaN(purchaseDate.getTime())
        ? new Date().toLocaleString()
        : purchaseDate.toLocaleString();
    const safeStudentName = escapeHtml(studentName);
    const safePurchaseDate = escapeHtml(formattedPurchaseDate);

    const coursesHtml = safeCourses
        .map((course, index) => {
            const title = escapeHtml(course?.title || "Untitled Course");
            const price = Number(course?.price || 0).toFixed(2);
            return `
          <tr>
            <td style="padding: 8px 0; color: #2d3748;">${index + 1}. ${title}</td>
            <td style="padding: 8px 0; color: #2d3748; text-align: right;">INR ${price}</td>
          </tr>
        `;
        })
        .join("");

    const coursesText = safeCourses
        .map((course, index) => {
            const title = course?.title || "Untitled Course";
            const price = Number(course?.price || 0).toFixed(2);
            return `${index + 1}. ${title} - INR ${price}`;
        })
        .join("\n");

    const total = Number(totalAmount || 0).toFixed(2);

    const mailOptions = {
        from: `"SeekhoBharat" <${process.env.SMTP_USER}>`,
        to,
        subject: "Course Purchase Confirmation - SeekhoBharat",
        text: `Hi ${studentName},\n\nYour course purchase has been confirmed on ${formattedPurchaseDate}.\n\nPurchased courses:\n${coursesText || "No courses listed"}\n\nTotal Amount: INR ${total}\n\nYou can now access your courses from your dashboard.\n\nThank you for learning with SeekhoBharat.`,
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f7fafc; border-radius: 12px; color: #1a202c;">
        <h2 style="margin: 0 0 8px; color: #1a202c;">Purchase Confirmed</h2>
        <p style="margin: 0 0 16px; color: #4a5568;">Hi ${safeStudentName}, your payment was successful.</p>
        <p style="margin: 0 0 16px; color: #4a5568;">Purchase Date: <strong>${safePurchaseDate}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">Course</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${coursesHtml || "<tr><td colspan='2' style='padding: 8px 0; color: #718096;'>No courses listed</td></tr>"}
          </tbody>
        </table>
        <p style="margin: 0 0 16px; font-size: 16px; color: #1a202c;">Total Amount: <strong>INR ${total}</strong></p>
        <p style="margin: 0; color: #4a5568;">You can now start learning from your enrolled courses section.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail, sendCoursePurchaseConfirmationEmail };
