-- CreateEnum
CREATE TYPE "enum_AdditionalMemberFields_type" AS ENUM ('string', 'boolean');

-- CreateTable
CREATE TABLE "AdditionalMemberField" (
    "id" SERIAL NOT NULL,
    "type" "enum_AdditionalMemberFields_type" NOT NULL,
    "label" VARCHAR NOT NULL,

    CONSTRAINT "AdditionalMemberField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalMemberData" (
    "member_id" VARCHAR NOT NULL,
    "field_id" INTEGER NOT NULL,
    "value" VARCHAR NOT NULL,

    CONSTRAINT "AdditionalMemberData_pkey" PRIMARY KEY ("member_id","field_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdditionalMemberData_member_id_field_id_key" ON "AdditionalMemberData"("member_id", "field_id");

-- AddForeignKey
ALTER TABLE "AdditionalMemberData" ADD CONSTRAINT "AdditionalMemberData_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalMemberData" ADD CONSTRAINT "AdditionalMemberData_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "AdditionalMemberField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
