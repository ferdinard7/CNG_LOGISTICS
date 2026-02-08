/*
  Warnings:

  - A unique constraint covering the columns `[withdrawalId]` on the table `WalletTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('OFFLINE', 'AVAILABLE', 'BUSY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "maxActiveOrders" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "withdrawalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_withdrawalId_key" ON "WalletTransaction"("withdrawalId");
