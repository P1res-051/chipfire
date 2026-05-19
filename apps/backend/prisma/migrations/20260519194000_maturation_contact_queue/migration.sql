ALTER TABLE "WhatsAppInstance"
ADD COLUMN "maturationTargetMode" TEXT NOT NULL DEFAULT 'INSTANCES',
ADD COLUMN "maturationContactTag" TEXT;
