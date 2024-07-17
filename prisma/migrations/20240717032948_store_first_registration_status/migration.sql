/*
  Warnings:

  - You are about to drop the column `slack_department` on the `Members` table. All the data in the column will be lost.
  - You are about to drop the column `slack_leaderboard_type` on the `Members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Members" DROP COLUMN "slack_department",
DROP COLUMN "slack_leaderboard_type",
ADD COLUMN     "frc_registered" BOOLEAN NOT NULL DEFAULT false;
