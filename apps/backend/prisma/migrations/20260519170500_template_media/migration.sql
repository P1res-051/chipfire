ALTER TABLE "MessageTemplate"
  ADD COLUMN "mediaId" TEXT;

CREATE INDEX "MessageTemplate_mediaId_idx" ON "MessageTemplate"("mediaId");

ALTER TABLE "MessageTemplate"
  ADD CONSTRAINT "MessageTemplate_mediaId_fkey"
  FOREIGN KEY ("mediaId")
  REFERENCES "MediaLibrary"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
