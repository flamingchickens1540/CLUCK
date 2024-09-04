/*
  Warnings:

  - Added the required column `state` to the `MemberCerts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "enum_MemberCerts_state" AS ENUM ('pending', 'approved');

-- AlterTable
ALTER TABLE "MemberCerts" ADD COLUMN     "given_by" TEXT,
ADD COLUMN     "state" "enum_MemberCerts_state" NOT NULL;

-- AddForeignKey
ALTER TABLE "MemberCerts" ADD CONSTRAINT "MemberCerts_given_by_fkey" FOREIGN KEY ("given_by") REFERENCES "Members"("email") ON DELETE SET NULL ON UPDATE CASCADE;
