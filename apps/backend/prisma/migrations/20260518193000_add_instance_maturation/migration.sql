ALTER TABLE "WhatsAppInstance"
ADD COLUMN "maturationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maturationLastSentAt" TIMESTAMP(3),
ADD COLUMN "maturationLastQueueAt" TIMESTAMP(3);
