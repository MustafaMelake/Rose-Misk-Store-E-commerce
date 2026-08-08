-- Replace numeric stock tracking on ProductVariant with a simple
-- Available / Not Available toggle.

-- 1. Add the new flag (new rows default to available).
ALTER TABLE "ProductVariant" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- 2. Backfill from the quantities being retired: anything currently sitting at
--    zero units stays unavailable instead of silently becoming buyable.
UPDATE "ProductVariant" SET "isAvailable" = ("stock" > 0);

-- 3. Drop the retired column.
ALTER TABLE "ProductVariant" DROP COLUMN "stock";
