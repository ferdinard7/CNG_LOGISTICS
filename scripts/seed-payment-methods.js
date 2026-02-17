/**
 * Seed Interswitch and Paystack payment methods.
 * Run: node scripts/seed-payment-methods.js
 * Requires INTERSWITCH_* and PAYSTACK_SECRET_KEY in .env
 */
import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function seed() {
  try {
    // Interswitch
    let isw = await prisma.paymentMethod.findFirst({
      where: { provider: "INTERSWITCH" },
    });
    if (!isw) {
      const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE?.trim();
      const payItemId = process.env.INTERSWITCH_PAY_ITEM_ID?.trim();
      const hmacSecret = process.env.INTERSWITCH_HMAC_SECRET?.trim();

      if (!merchantCode || !payItemId || !hmacSecret) {
        console.warn("Skipping Interswitch: set INTERSWITCH_MERCHANT_CODE, INTERSWITCH_PAY_ITEM_ID, INTERSWITCH_HMAC_SECRET in .env");
      } else {
        isw = await prisma.paymentMethod.create({
          data: {
            name: "Interswitch",
            provider: "INTERSWITCH",
            isActive: true,
            supportedCurrencies: ["NGN"],
            config: {
              merchantCode,
              payItemId,
              hmacSecret,
              initUrl: process.env.INTERSWITCH_INIT_URL || "https://newwebpay.qa.interswitchng.com/collections/w/pay",
              verifyUrl: process.env.INTERSWITCH_VERIFY_URL || "https://sandbox.interswitchng.com/api/v3/purchases/verify",
              mode: process.env.INTERSWITCH_MODE || "TEST",
              currencyNumeric: Number(process.env.INTERSWITCH_CURRENCY_NUMERIC) || 566,
            },
          },
        });
        console.log("Created Interswitch payment method:", isw.id);
      }
    } else {
      console.log("Interswitch payment method already exists");
    }

    // Paystack
    let psk = await prisma.paymentMethod.findFirst({
      where: { provider: "PAYSTACK" },
    });
    if (!psk) {
      const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
      if (!secretKey) {
        console.warn("Skipping Paystack: set PAYSTACK_SECRET_KEY in .env");
      } else {
        psk = await prisma.paymentMethod.create({
          data: {
            name: "Paystack",
            provider: "PAYSTACK",
            isActive: true,
            supportedCurrencies: ["NGN"],
            config: {},
          },
        });
        console.log("Created Paystack payment method:", psk.id);
      }
    } else {
      console.log("Paystack payment method already exists");
    }

    console.log("Done. Frontend: GET /api/v1/payment/methods");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
