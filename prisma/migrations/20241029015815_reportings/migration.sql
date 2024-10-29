/*
  Warnings:

  - You are about to drop the column `reporter` on the `Violations` table. All the data in the column will be lost.
  - Added the required column `description` to the `Violations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reporter_slack_id` to the `Violations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Violations" DROP CONSTRAINT "Violations_reporter_fkey";

-- AlterTable
ALTER TABLE "Violations" DROP COLUMN "reporter",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "reporter_slack_id" TEXT NOT NULL;
