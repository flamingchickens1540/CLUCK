/*
  Warnings:

  - You are about to drop the column `managerCert` on the `Certs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Certs" DROP CONSTRAINT "Certs_managerCert_fkey";

-- AlterTable
ALTER TABLE "Certs" DROP COLUMN "managerCert",
ADD COLUMN     "department" VARCHAR;

-- CreateTable
CREATE TABLE "Departments" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slack_group" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentAssociations" (
    "department_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentAssociations_pkey" PRIMARY KEY ("department_id","member_id")
);

-- AddForeignKey
ALTER TABLE "DepartmentAssociations" ADD CONSTRAINT "DepartmentAssociations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentAssociations" ADD CONSTRAINT "DepartmentAssociations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certs" ADD CONSTRAINT "Certs_department_fkey" FOREIGN KEY ("department") REFERENCES "Departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
