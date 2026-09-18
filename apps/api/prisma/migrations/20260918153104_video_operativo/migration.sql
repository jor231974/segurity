/*
  Warnings:

  - Added the required column `objectKey` to the `video_recordings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "video_recordings" ADD COLUMN     "audioEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bitrate" INTEGER,
ADD COLUMN     "clientId" UUID,
ADD COLUMN     "evidenceAt" TIMESTAMP(3),
ADD COLUMN     "evidenceById" UUID,
ADD COLUMN     "evidenceReason" TEXT,
ADD COLUMN     "fps" INTEGER,
ADD COLUMN     "fragmentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "objectKey" TEXT,
ADD COLUMN     "postId" UUID,
ADD COLUMN     "retentionPolicy" TEXT NOT NULL DEFAULT 'temporal',
ADD COLUMN     "serviceId" UUID,
ADD COLUMN     "siteId" UUID,
ALTER COLUMN "expiresAt" DROP NOT NULL;

UPDATE "video_recordings" SET "objectKey" = "filePath" WHERE "objectKey" IS NULL;

ALTER TABLE "video_recordings" ALTER COLUMN "objectKey" SET NOT NULL;

-- AlterTable
ALTER TABLE "video_streams" ADD COLUMN     "audioEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bitrate" INTEGER,
ADD COLUMN     "clientId" UUID,
ADD COLUMN     "currentBytes" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "fps" INTEGER,
ADD COLUMN     "fragmentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFragmentAt" TIMESTAMP(3),
ADD COLUMN     "maxDurationSec" INTEGER,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "postId" UUID,
ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "siteId" UUID;

-- CreateTable
CREATE TABLE "video_fragments" (
    "id" UUID NOT NULL,
    "streamId" UUID NOT NULL,
    "recordingId" UUID,
    "sequence" INTEGER NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_fragments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_audit_logs" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "videoId" UUID,
    "streamId" UUID,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "device" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_fragments_recordingId_idx" ON "video_fragments"("recordingId");

-- CreateIndex
CREATE UNIQUE INDEX "video_fragments_streamId_sequence_key" ON "video_fragments"("streamId", "sequence");

-- CreateIndex
CREATE INDEX "video_audit_logs_companyId_createdAt_idx" ON "video_audit_logs"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "video_audit_logs_videoId_idx" ON "video_audit_logs"("videoId");

-- CreateIndex
CREATE INDEX "video_audit_logs_streamId_idx" ON "video_audit_logs"("streamId");

-- CreateIndex
CREATE INDEX "video_audit_logs_userId_idx" ON "video_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "video_recordings_siteId_idx" ON "video_recordings"("siteId");

-- CreateIndex
CREATE INDEX "video_recordings_clientId_idx" ON "video_recordings"("clientId");

-- CreateIndex
CREATE INDEX "video_recordings_retentionPolicy_idx" ON "video_recordings"("retentionPolicy");

-- CreateIndex
CREATE INDEX "video_streams_lastFragmentAt_idx" ON "video_streams"("lastFragmentAt");

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "contract_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_fragments" ADD CONSTRAINT "video_fragments_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "video_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_fragments" ADD CONSTRAINT "video_fragments_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "video_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "contract_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_evidenceById_fkey" FOREIGN KEY ("evidenceById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_audit_logs" ADD CONSTRAINT "video_audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_audit_logs" ADD CONSTRAINT "video_audit_logs_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "video_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_audit_logs" ADD CONSTRAINT "video_audit_logs_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "video_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_audit_logs" ADD CONSTRAINT "video_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
