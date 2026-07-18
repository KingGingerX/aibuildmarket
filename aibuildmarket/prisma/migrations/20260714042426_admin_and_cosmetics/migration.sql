-- CreateEnum
CREATE TYPE "CosmeticType" AS ENUM ('FONT', 'EMOJI');

-- CreateEnum
CREATE TYPE "CosmeticPurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "authorFontId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CosmeticPack" (
    "id" TEXT NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CosmeticPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CosmeticPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "CosmeticPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CosmeticPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticPack_slug_key" ON "CosmeticPack"("slug");

-- CreateIndex
CREATE INDEX "CosmeticPack_type_active_idx" ON "CosmeticPack"("type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticPurchase_stripeSessionId_key" ON "CosmeticPurchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "CosmeticPurchase_userId_idx" ON "CosmeticPurchase"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticPurchase_userId_packId_key" ON "CosmeticPurchase"("userId", "packId");

-- AddForeignKey
ALTER TABLE "CosmeticPurchase" ADD CONSTRAINT "CosmeticPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmeticPurchase" ADD CONSTRAINT "CosmeticPurchase_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CosmeticPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
