-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isPayoutProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutAmount" DECIMAL(12,2),
ADD COLUMN     "payoutProcessedAt" TIMESTAMP(3),
ADD COLUMN     "payoutProcessedBy" TEXT;
