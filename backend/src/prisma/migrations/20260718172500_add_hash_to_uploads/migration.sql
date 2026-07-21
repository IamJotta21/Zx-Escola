-- AlterTable
ALTER TABLE "uploaded_files" ADD COLUMN "hash" TEXT;
ALTER TABLE "uploaded_files" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'UPLOADED';
