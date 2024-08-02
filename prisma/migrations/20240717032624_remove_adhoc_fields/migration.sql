/*
  Warnings:

  - You are about to drop the `AdditionalMemberData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdditionalMemberField` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdditionalMemberData" DROP CONSTRAINT "AdditionalMemberData_field_id_fkey";

-- DropForeignKey
ALTER TABLE "AdditionalMemberData" DROP CONSTRAINT "AdditionalMemberData_member_id_fkey";

-- DropTable
DROP TABLE "AdditionalMemberData";

-- DropTable
DROP TABLE "AdditionalMemberField";

-- DropEnum
DROP TYPE "enum_AdditionalMemberFields_type";
