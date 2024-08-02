/*
  Warnings:

  - You are about to drop the column `given_by` on the `MemberCerts` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `MemberCerts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "enum_MemberCertsRequest_state" AS ENUM ('pending', 'approved');

-- DropForeignKey
ALTER TABLE "MemberCerts" DROP CONSTRAINT "MemberCerts_given_by_fkey";

-- AlterTable
ALTER TABLE "MemberCerts" DROP COLUMN "given_by",
DROP COLUMN "state";

-- DropEnum
DROP TYPE "enum_MemberCerts_state";

-- CreateTable
CREATE TABLE "MemberCertRequests" (
    "id" SERIAL NOT NULL,
    "cert_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "state" "enum_MemberCertsRequest_state" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MemberCertRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membercertrequests_memberid" ON "MemberCertRequests"("member_id");

-- CreateIndex
CREATE INDEX "membercertrequests_certid" ON "MemberCertRequests"("cert_id");

-- AddForeignKey
ALTER TABLE "MemberCertRequests" ADD CONSTRAINT "MemberCertRequests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCertRequests" ADD CONSTRAINT "MemberCertRequests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCertRequests" ADD CONSTRAINT "MemberCertRequests_cert_id_fkey" FOREIGN KEY ("cert_id") REFERENCES "Certs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
