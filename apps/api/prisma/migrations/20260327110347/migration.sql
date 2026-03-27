-- DropIndex
DROP INDEX "product_name_trgm_idx";

-- CreateIndex
CREATE INDEX "Product_status_price_idx" ON "Product"("status", "price");
