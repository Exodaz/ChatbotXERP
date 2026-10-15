CREATE TABLE "WorkspaceRole" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"workspaceId" bigint NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '{}' NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD COLUMN "liveCode" text;--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD COLUMN "availableQuantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD COLUMN "incomingQuantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD COLUMN "maxCapQuantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD COLUMN "reservedQuantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "WorkspaceRole_workspaceId_idx" ON "WorkspaceRole" ("workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX "WorkspaceRole_workspaceId_name_key" ON "WorkspaceRole" ("workspaceId","name");--> statement-breakpoint
ALTER TABLE "WorkspaceRole" ADD CONSTRAINT "WorkspaceRole_workspaceId_Workspace_id_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;