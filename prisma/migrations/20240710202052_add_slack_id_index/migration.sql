/*
  Warnings:

  - A unique constraint covering the columns `[slack_id]` on the table `Members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Members_slack_id_key" ON "Members"("slack_id");

-- CreateIndex
CREATE INDEX "members_slack_id" ON "Members"("slack_id");
