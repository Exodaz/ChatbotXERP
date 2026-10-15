CREATE TYPE "orderStatus" AS ENUM('reserved', 'pending_payment', 'paid', 'packing', 'shipped', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "paymentMethod" AS ENUM('bank_transfer', 'moneyspace_credit_card', 'qr_code', 'cod');--> statement-breakpoint
CREATE TYPE "paymentStatus" AS ENUM('pending', 'awaiting_approval', 'verified', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "Order" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"workspaceId" bigint NOT NULL,
	"contactId" bigint NOT NULL,
	"orderNumber" text NOT NULL,
	"orderToken" text NOT NULL,
	"liveSessionId" text,
	"status" "orderStatus" DEFAULT 'reserved'::"orderStatus" NOT NULL,
	"paymentMethod" "paymentMethod",
	"paymentStatus" "paymentStatus" DEFAULT 'pending'::"paymentStatus" NOT NULL,
	"subtotal" double precision DEFAULT 0 NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"shippingFee" double precision DEFAULT 0 NOT NULL,
	"totalAmount" double precision DEFAULT 0 NOT NULL,
	"slipUrl" text,
	"slipVerifiedData" jsonb,
	"paymentApprovedBy" bigint,
	"paymentApprovedAt" timestamp(6) with time zone,
	"shippingAddress" jsonb,
	"trackingNumber" text,
	"shippingCarrier" text,
	"expiresAt" timestamp(6) with time zone
);
--> statement-breakpoint
CREATE TABLE "OrderItem" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"orderId" bigint NOT NULL,
	"productId" bigint NOT NULL,
	"variantId" bigint,
	"productName" text NOT NULL,
	"variantDescription" text,
	"sku" text,
	"liveCode" text,
	"unitPrice" double precision DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"totalPrice" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "Order_workspaceId_idx" ON "Order" ("workspaceId");--> statement-breakpoint
CREATE INDEX "Order_contactId_idx" ON "Order" ("contactId");--> statement-breakpoint
CREATE UNIQUE INDEX "Order_workspaceId_orderNumber_key" ON "Order" ("workspaceId","orderNumber");--> statement-breakpoint
CREATE UNIQUE INDEX "Order_orderToken_key" ON "Order" ("orderToken");--> statement-breakpoint
CREATE INDEX "Order_liveSessionId_idx" ON "Order" ("liveSessionId");--> statement-breakpoint
CREATE INDEX "Order_status_idx" ON "Order" ("status");--> statement-breakpoint
CREATE INDEX "Order_expiresAt_idx" ON "Order" ("expiresAt");--> statement-breakpoint
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem" ("orderId");--> statement-breakpoint
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem" ("productId");--> statement-breakpoint
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem" ("variantId");--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_workspaceId_Workspace_id_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_contactId_Contact_id_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_Order_id_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_Product_id_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_ProductVariant_id_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;