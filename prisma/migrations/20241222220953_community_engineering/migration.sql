/*
  Warnings:

  - You are about to drop the column `is_primary_team` on the `Members` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "enum_Member_Team" AS ENUM ('primary', 'junior', 'community');

-- AlterTable
ALTER TABLE "Members" DROP COLUMN "is_primary_team",
ADD COLUMN     "team" "enum_Member_Team";
