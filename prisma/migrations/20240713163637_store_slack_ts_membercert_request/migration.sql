-- AlterEnum
ALTER TYPE "enum_MemberCertsRequest_state" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "MemberCertRequests" ADD COLUMN     "slack_ts" TEXT;
