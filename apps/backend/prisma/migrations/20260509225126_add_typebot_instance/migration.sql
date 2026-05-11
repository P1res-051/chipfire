-- AlterTable
ALTER TABLE "TypebotFlow" ADD COLUMN     "instanceId" TEXT;

-- CreateIndex
CREATE INDEX "TypebotFlow_instanceId_idx" ON "TypebotFlow"("instanceId");

-- AddForeignKey
ALTER TABLE "TypebotFlow" ADD CONSTRAINT "TypebotFlow_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WhatsAppInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
