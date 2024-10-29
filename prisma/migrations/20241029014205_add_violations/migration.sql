-- CreateTable
CREATE TABLE "Violations" (
    "id" SERIAL NOT NULL,
    "member" TEXT NOT NULL,
    "reporter" TEXT,

    CONSTRAINT "Violations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Violations" ADD CONSTRAINT "Violations_member_fkey" FOREIGN KEY ("member") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violations" ADD CONSTRAINT "Violations_reporter_fkey" FOREIGN KEY ("reporter") REFERENCES "Members"("email") ON DELETE SET NULL ON UPDATE CASCADE;
