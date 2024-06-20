-- CreateTable
CREATE TABLE "MemberCerts" (
    "id" SERIAL NOT NULL,
    "cert_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MemberCerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membercerts_memberid" ON "MemberCerts"("member_id");

-- CreateIndex
CREATE INDEX "membercerts_certid" ON "MemberCerts"("cert_id");

-- AddForeignKey
ALTER TABLE "MemberCerts" ADD CONSTRAINT "MemberCerts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCerts" ADD CONSTRAINT "MemberCerts_cert_id_fkey" FOREIGN KEY ("cert_id") REFERENCES "Certs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
