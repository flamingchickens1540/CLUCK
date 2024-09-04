-- CreateEnum
CREATE TYPE "attendance_state" AS ENUM ('present', 'absent', 'no_credit');

-- CreateEnum
CREATE TYPE "enum_HourLogs_state" AS ENUM ('complete', 'pending', 'cancelled');

-- CreateEnum
CREATE TYPE "enum_HourLogs_type" AS ENUM ('lab', 'external', 'summer', 'event');

-- CreateEnum
CREATE TYPE "enum_MeetingAttendances_state" AS ENUM ('present', 'absent', 'no_credit');

-- CreateEnum
CREATE TYPE "enum_Members_slack_leaderboard_type" AS ENUM ('weekly', 'department');

-- CreateEnum
CREATE TYPE "enum_Members_team" AS ENUM ('primary', 'junior');

-- CreateEnum
CREATE TYPE "hours_category" AS ENUM ('lab', 'external', 'summer', 'event');

-- CreateEnum
CREATE TYPE "hours_state" AS ENUM ('complete', 'in_progress', 'pending', 'voided');

-- CreateEnum
CREATE TYPE "team_option" AS ENUM ('primary', 'junior');

-- CreateTable
CREATE TABLE "Accounts" (
    "id" VARCHAR(255) NOT NULL,
    "password" CHAR(64) NOT NULL,
    "api_key" CHAR(36) NOT NULL,
    "write_access" BOOLEAN NOT NULL,
    "admin_access" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certs" (
    "id" VARCHAR(15) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "department" VARCHAR(50) NOT NULL,
    "level" SMALLINT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Certs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourLogs" (
    "id" SERIAL NOT NULL,
    "member_id" VARCHAR(50) NOT NULL,
    "time_in" TIMESTAMPTZ(6) NOT NULL,
    "time_out" TIMESTAMPTZ(6),
    "duration" DECIMAL(6,3),
    "type" "enum_HourLogs_type" NOT NULL,
    "state" "enum_HourLogs_state" NOT NULL,
    "message" VARCHAR(2000),
    "slack_ts" DECIMAL(16,6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HourLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendances" (
    "id" SERIAL NOT NULL,
    "state" "enum_MeetingAttendances_state" NOT NULL,
    "meeting_id" SMALLINT NOT NULL,
    "member_id" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MeetingAttendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meetings" (
    "id" SMALLSERIAL NOT NULL,
    "date" DATE NOT NULL,
    "mandatory" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Members" (
    "email" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "team" "enum_Members_team" NOT NULL,
    "grade" SMALLINT NOT NULL,
    "years" SMALLINT NOT NULL,
    "use_slack_photo" BOOLEAN NOT NULL,
    "slack_id" VARCHAR(15),
    "slack_photo" VARCHAR(255),
    "slack_photo_small" VARCHAR(255),
    "slack_leaderboard_type" "enum_Members_slack_leaderboard_type",
    "slack_department" VARCHAR(50),
    "fallback_photo" VARCHAR(255),
    "cert_ids" VARCHAR(15)[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Members_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "accounts_api_key" ON "Accounts"("api_key");

-- CreateIndex
CREATE INDEX "hour_logs_member_id" ON "HourLogs"("member_id");

-- CreateIndex
CREATE INDEX "hour_logs_state" ON "HourLogs"("state");

-- CreateIndex
CREATE INDEX "hour_logs_type" ON "HourLogs"("type");

-- CreateIndex
CREATE INDEX "meeting_attendances_meeting_id" ON "MeetingAttendances"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_attendances_member_id" ON "MeetingAttendances"("member_id");

-- CreateIndex
CREATE INDEX "members_full_name" ON "Members"("full_name");

-- AddForeignKey
ALTER TABLE "HourLogs" ADD CONSTRAINT "HourLogs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendances" ADD CONSTRAINT "MeetingAttendances_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendances" ADD CONSTRAINT "MeetingAttendances_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Members"("email") ON DELETE CASCADE ON UPDATE CASCADE;

