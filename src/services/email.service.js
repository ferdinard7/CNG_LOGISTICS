import { Resend } from "resend";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

let resendClient;

const getResend = () => {
  if (resendClient) return resendClient;
  if (!env.resendApiKey) throw new Error("Missing RESEND_API_KEY (env.resendApiKey)");
  resendClient = new Resend(env.resendApiKey);
  return resendClient;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const resend = getResend();

  if (!env.emailFrom) throw new Error("Missing EMAIL_FROM (env.emailFrom)");

  try {
    const { data, error } = await resend.emails.send({
      from: env.emailFrom, // "Name <email@domain.com>"
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      logger.error("Resend sendEmail error", { to, error });
      throw new Error(`Resend error: ${error?.message || "Unknown error"}`);
    }

    logger.info("Email sent (Resend)", { to, id: data?.id });
    return data;
  } catch (err) {
    logger.error("Resend sendEmail failed", { to, err: err?.message, stack: err?.stack });
    throw err;
  }
};

export const sendPasswordResetEmail = async ({ to, token }) => {
  const appName = env.appName || "CNG Logistics";
  const frontendBase = env.frontendBaseUrl || env.appBaseUrl || "http://localhost:5000";

  const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = `${appName} - Reset your password`;

  const text =
    `You requested a password reset.\n\n` +
    `Reset link: ${resetLink}\n\n` +
    `If you did not request this, ignore this email.`;

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