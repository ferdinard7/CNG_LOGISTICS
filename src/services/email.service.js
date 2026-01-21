import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort),
    secure: String(env.smtpSecure).toLowerCase() === "true",
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();

  const from = env.smtpFrom || `${env.appName || "App"} <${env.smtpUser}>`;

  const info = await tx.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  logger.info("Email sent", { to, messageId: info.messageId });
  return info;
};

export const sendPasswordResetEmail = async ({ to, token }) => {
  const appName = env.appName || "CNG Logistics";
  const frontendBase = env.frontendBaseUrl || env.appBaseUrl || "http://localhost:5000";

  // Your frontend route can be /reset-password?token=...
  const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = `${appName} - Reset your password`;

  const text = `You requested a password reset.\n\nReset link: ${resetLink}\n\nIf you did not request this, ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${appName} - Password Reset</h2>
      <p>You requested to reset your password.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 14px;text-decoration:none;border-radius:6px;border:1px solid #222;">
          Reset Password
        </a>
      </p>
      <p>Or copy this link:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p style="margin-top:18px;color:#666;">
        If you did not request this, you can ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};