-- Phase 2 of instance maturation: configurable cadence, daily cap, dynamic content and richer logs.
ALTER TABLE "WhatsAppInstance"
  ADD COLUMN "maturationMessagesPerCycle" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "maturationDailyLimit" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "maturationIntervalMinSeconds" INTEGER NOT NULL DEFAULT 180,
  ADD COLUMN "maturationIntervalMaxSeconds" INTEGER NOT NULL DEFAULT 420,
  ADD COLUMN "maturationContentGroupSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "InstanceMaturationLog"
  ADD COLUMN "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
  ADD COLUMN "contentGroupSlug" TEXT;
