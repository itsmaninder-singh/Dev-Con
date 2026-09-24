/**
 * Email sender utility for DevConnect.
 * Supports SMTP/Nodemailer if configured, with graceful console fallback in development.
 */

export const sendEmail = async ({ to, subject, html, text }) => {
  const isConfigured = Boolean(
    process.env.SMTP_HOST ||
    process.env.EMAIL_USER ||
    process.env.SENDGRID_API_KEY
  );

  if (isConfigured) {
    try {
      // Attempt dynamic import of nodemailer if available
      const nodemailer = await import("nodemailer").then((m) => m.default || m);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"DevConnect" <no-reply@devconnect.dev>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`[sendEmail] Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.warn(`[sendEmail] SMTP delivery failed (${err.message}). Falling back to console output.`);
    }
  }

  // Console Fallback for local development
  console.log("\n=======================================================");
  console.log("             📬 DEVCONNECT EMAIL DISPATCH              ");
  console.log("=======================================================");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("-------------------------------------------------------");
  console.log(text || html);
  console.log("=======================================================\n");

  return { success: true, fallback: true };
};
