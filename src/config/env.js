import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "20m",
  refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 14),
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "cnc-logistics",
  cookieRefreshName: process.env.COOKIE_REFRESH_NAME || "cnc_refresh",
  appName: process.env.APP_NAME,
  appBaseUrl: process.env.APP_BASE_URL,
  frontendBaseUrl: process.env.FRONTEND_BASE_URL,

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpSecure: process.env.SMTP_SECURE,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,

  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,

  // Payment - Interswitch
  INTERSWITCH_MERCHANT_CODE: process.env.INTERSWITCH_MERCHANT_CODE,
  INTERSWITCH_PAY_ITEM_ID: process.env.INTERSWITCH_PAY_ITEM_ID,
  INTERSWITCH_HMAC_SECRET: process.env.INTERSWITCH_HMAC_SECRET,
  INTERSWITCH_INIT_URL: process.env.INTERSWITCH_INIT_URL || "https://newwebpay.qa.interswitchng.com/collections/w/pay",
  INTERSWITCH_VERIFY_URL: process.env.INTERSWITCH_VERIFY_URL || "https://sandbox.interswitchng.com/api/v3/purchases/verify",
  INTERSWITCH_SITE_REDIRECT_URL: process.env.INTERSWITCH_SITE_REDIRECT_URL,
  INTERSWITCH_CALLBACK_URL: process.env.INTERSWITCH_CALLBACK_URL,
  INTERSWITCH_MODE: process.env.INTERSWITCH_MODE || "TEST",
  INTERSWITCH_CURRENCY_NUMERIC: process.env.INTERSWITCH_CURRENCY_NUMERIC || "566",
  INTERSWITCH_SIGNATURE_HEADER: process.env.INTERSWITCH_SIGNATURE_HEADER || "x-interswitch-signature",

  // Payment - Paystack
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,

  // Base URL for callbacks (e.g. https://cng-logistics.onrender.com)
  BASE_URL: process.env.BASE_URL || process.env.APP_BASE_URL,

  // Prembly identity verification (NIN for riders, driver's license for truck drivers)
  PREMBLY_SECRET_KEY: process.env.PREMBLY_SECRET_KEY,
  PREMBLY_BASE_URL: (process.env.PREMBLY_BASE_URL || "https://api.prembly.com").replace(/;\s*$/, ""),
};