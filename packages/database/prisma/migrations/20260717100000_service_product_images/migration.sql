-- Service card/hero image + product logo (uploaded via the admin editors)
ALTER TABLE "services" ADD COLUMN "image" TEXT;
ALTER TABLE "products" ADD COLUMN "logoImage" TEXT;
