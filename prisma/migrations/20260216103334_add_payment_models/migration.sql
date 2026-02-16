-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('INTERSWITCH', 'PAYSTACK');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'pending';

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportedCurrencies" TEXT[] DEFAULT ARRAY['NGN']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookNotification" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "paymentReference" TEXT,
    "orderId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "rawBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_providerReference_idx" ON "PaymentTransaction"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentWebhookNotification_provider_idx" ON "PaymentWebhookNotification"("provider");

-- CreateIndex
CREATE INDEX "PaymentWebhookNotification_paymentReference_idx" ON "PaymentWebhookNotification"("paymentReference");

-- CreateIndex
CREATE INDEX "PaymentWebhookNotification_orderId_idx" ON "PaymentWebhookNotification"("orderId");

-- CreateIndex
CREATE INDEX "PaymentWebhookNotification_createdAt_idx" ON "PaymentWebhookNotification"("createdAt");

-- CreateIndex
CREATE INDEX "Order_orderCode_idx" ON "Order"("orderCode");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
