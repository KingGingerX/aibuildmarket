-- User: profile picture
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- Listing: replace boolean "active" with a real status, add cross-post flag and boost window
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'INACTIVE');

ALTER TABLE "Listing" ADD COLUMN "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Listing" ADD COLUMN "crossPosted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "boostedUntil" TIMESTAMP(3);

-- Backfill status from the old boolean before dropping it, so nothing that was
-- deactivated (by admin or by a completed sale) silently reappears as ACTIVE.
UPDATE "Listing" SET "status" = 'INACTIVE' WHERE "active" = false;
UPDATE "Listing" SET "status" = 'SOLD' WHERE "id" IN (
  SELECT DISTINCT "listingId" FROM "Order" WHERE "status" = 'COMPLETED'
);

DROP INDEX "Listing_active_createdAt_idx";
ALTER TABLE "Listing" DROP COLUMN "active";
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

-- Order -> Listing: allow cascading delete so a seller can delete a listing
-- that only ever had pending/cancelled orders against it. Listings with a
-- COMPLETED order are blocked from deletion at the application layer before
-- this constraint would ever be exercised, so real sale history is never lost.
ALTER TABLE "Order" DROP CONSTRAINT "Order_listingId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Password reset tokens (separate from email-verification tokens so consuming
-- one never touches emailVerified).
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Listing boosts: paid, time-boxed bump to the top of browse/search.
CREATE TABLE "BoostPurchase" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "status" "CosmeticPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BoostPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoostPurchase_stripeSessionId_key" ON "BoostPurchase"("stripeSessionId");
CREATE INDEX "BoostPurchase_listingId_idx" ON "BoostPurchase"("listingId");
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
