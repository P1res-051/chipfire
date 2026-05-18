ALTER TABLE "WhatsAppInstance"
ADD COLUMN "maturationNextSendAt" TIMESTAMP(3),
ADD COLUMN "maturationCurrentTargetId" TEXT,
ADD COLUMN "maturationCurrentTargetName" TEXT;

CREATE TABLE "InstanceMaturationLog" (
  "id" TEXT NOT NULL,
  "originInstanceId" TEXT NOT NULL,
  "targetInstanceId" TEXT,
  "targetInstanceName" TEXT NOT NULL,
  "targetPhoneNumber" TEXT,
  "templateId" TEXT,
  "templateName" TEXT,
  "text" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "errorMessage" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstanceMaturationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstanceMaturationLog_originInstanceId_idx" ON "InstanceMaturationLog"("originInstanceId");
CREATE INDEX "InstanceMaturationLog_occurredAt_idx" ON "InstanceMaturationLog"("occurredAt");

ALTER TABLE "InstanceMaturationLog"
ADD CONSTRAINT "InstanceMaturationLog_originInstanceId_fkey"
FOREIGN KEY ("originInstanceId") REFERENCES "WhatsAppInstance"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
