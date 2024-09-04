/*
  Warnings:

  - The primary key for the `MeetingAttendances` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `MeetingAttendances` table. All the data in the column will be lost.
  - The primary key for the `MemberCerts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `MemberCerts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slack_id]` on the table `Accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Accounts" ADD COLUMN     "slack_id" BOOLEAN;

-- AlterTable
ALTER TABLE "MeetingAttendances" DROP CONSTRAINT "MeetingAttendances_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "MeetingAttendances_pkey" PRIMARY KEY ("meeting_id", "member_id");

-- AlterTable
ALTER TABLE "MemberCerts" DROP CONSTRAINT "MemberCerts_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "MemberCerts_pkey" PRIMARY KEY ("cert_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_slack_id_key" ON "Accounts"("slack_id");
