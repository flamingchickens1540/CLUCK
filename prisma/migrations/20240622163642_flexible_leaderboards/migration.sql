/*
  Warnings:

  - The `slack_leaderboard_type` column on the `Members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Members" DROP COLUMN "slack_leaderboard_type",
ADD COLUMN     "slack_leaderboard_type" VARCHAR(50);

-- DropEnum
DROP TYPE "enum_Members_slack_leaderboard_type";
