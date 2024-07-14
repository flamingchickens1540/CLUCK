/*
  Warnings:

  - The values [pending] on the enum `enum_MemberCerts_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "enum_MemberCerts_state_new" AS ENUM ('pending_create', 'pending_delete', 'approved');
ALTER TABLE "MemberCerts" ALTER COLUMN "state" TYPE "enum_MemberCerts_state_new" USING ("state"::text::"enum_MemberCerts_state_new");
ALTER TYPE "enum_MemberCerts_state" RENAME TO "enum_MemberCerts_state_old";
ALTER TYPE "enum_MemberCerts_state_new" RENAME TO "enum_MemberCerts_state";
DROP TYPE "enum_MemberCerts_state_old";
COMMIT;
