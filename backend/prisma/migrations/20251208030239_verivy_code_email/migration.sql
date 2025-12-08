-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailLoginCode" TEXT,
ADD COLUMN     "emailLoginCodeExpiresAt" TIMESTAMP(3);
