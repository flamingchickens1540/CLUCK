/*
  Warnings:

  - You are about to drop the column `department` on the `Certs` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Certs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[replaces]` on the table `Certs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Certs" DROP COLUMN "department",
DROP COLUMN "level",
ADD COLUMN     "isManager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replaces" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "Certs_replaces_key" ON "Certs"("replaces");

-- AddForeignKey
ALTER TABLE "Certs" ADD CONSTRAINT "Certs_replaces_fkey" FOREIGN KEY ("replaces") REFERENCES "Certs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
