-- CreateEnum
CREATE TYPE "ContentGroupType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'MIXED');

-- CreateEnum
CREATE TYPE "ContentSelectionMode" AS ENUM ('RANDOM', 'SEQUENTIAL', 'WEIGHTED_RANDOM', 'LEAST_USED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "ContentGroup" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentGroupType" NOT NULL,
    "selectionMode" "ContentSelectionMode" NOT NULL DEFAULT 'RANDOM',
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" "ContentGroupType" NOT NULL,
    "textContent" TEXT,
    "mediaId" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentGroup_createdById_idx" ON "ContentGroup"("createdById");

-- CreateIndex
CREATE INDEX "ContentGroup_status_idx" ON "ContentGroup"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGroup_createdById_slug_key" ON "ContentGroup"("createdById", "slug");

-- CreateIndex
CREATE INDEX "ContentGroupItem_groupId_idx" ON "ContentGroupItem"("groupId");

-- CreateIndex
CREATE INDEX "ContentGroupItem_mediaId_idx" ON "ContentGroupItem"("mediaId");

-- CreateIndex
CREATE INDEX "ContentGroupItem_status_idx" ON "ContentGroupItem"("status");

-- AddForeignKey
ALTER TABLE "ContentGroup" ADD CONSTRAINT "ContentGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGroupItem" ADD CONSTRAINT "ContentGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ContentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGroupItem" ADD CONSTRAINT "ContentGroupItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaLibrary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
