-- AlterTable
ALTER TABLE "Accounts" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Certs" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "HourLogs" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MeetingAttendances" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Meetings" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Members" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "attendance_state";

-- DropEnum
DROP TYPE "hours_category";

-- DropEnum
DROP TYPE "hours_state";

-- DropEnum
DROP TYPE "team_option";
