-- CreateTable
CREATE TABLE "State" (
    "key" VARCHAR(128) NOT NULL,
    "valBool" BOOLEAN,
    "valString" TEXT,
    "valDate" TIMESTAMP(3),

    CONSTRAINT "State_pkey" PRIMARY KEY ("key")
);
