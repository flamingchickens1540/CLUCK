-- AlterTable
ALTER TABLE "Certs" ADD COLUMN     "managerCert" VARCHAR(15);

-- AddForeignKey
ALTER TABLE "Certs" ADD CONSTRAINT "Certs_managerCert_fkey" FOREIGN KEY ("managerCert") REFERENCES "Certs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
