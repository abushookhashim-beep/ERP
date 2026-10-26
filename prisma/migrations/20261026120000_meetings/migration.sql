-- CreateEnum
CREATE TYPE "MeetingMode" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InviteResponse" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "MeetingRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MeetingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "mode" "MeetingMode" NOT NULL,
    "roomId" TEXT,
    "onlineUrl" TEXT,
    "agenda" TEXT,
    "organizerId" TEXT NOT NULL,
    "secretaryId" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "minutes" TEXT,
    "minutesApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "response" "InviteResponse" NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "attended" BOOLEAN,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("meetingId","userId")
);

-- CreateTable
CREATE TABLE "MeetingAttachment" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "MeetingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingTask" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dueDate" DATE,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingRoom_name_key" ON "MeetingRoom"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_number_key" ON "Meeting"("number");

-- CreateIndex
CREATE INDEX "Meeting_startsAt_idx" ON "Meeting"("startsAt");

-- CreateIndex
CREATE INDEX "Meeting_roomId_startsAt_idx" ON "Meeting"("roomId", "startsAt");

-- CreateIndex
CREATE INDEX "MeetingAttendee_userId_idx" ON "MeetingAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttachment_fileId_key" ON "MeetingAttachment"("fileId");

-- CreateIndex
CREATE INDEX "MeetingTask_assigneeId_status_idx" ON "MeetingTask"("assigneeId", "status");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MeetingRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttachment" ADD CONSTRAINT "MeetingAttachment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttachment" ADD CONSTRAINT "MeetingAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTask" ADD CONSTRAINT "MeetingTask_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTask" ADD CONSTRAINT "MeetingTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTask" ADD CONSTRAINT "MeetingTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

