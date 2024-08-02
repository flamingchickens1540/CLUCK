/*
  Warnings:

  - You are about to drop the column `grade` on the `Members` table. All the data in the column will be lost.
  - You are about to drop the column `team` on the `Members` table. All the data in the column will be lost.
  - You are about to drop the column `years` on the `Members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Members" DROP COLUMN "grade",
DROP COLUMN "team",
DROP COLUMN "years";

-- DropEnum
DROP TYPE "enum_Members_team";
