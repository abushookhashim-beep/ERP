-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('HARDWARE', 'SOFTWARE', 'NETWORK', 'EMAIL', 'ACCESS', 'PRINTER', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "MeetingTask" ADD COLUMN     "description" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
ALTER COLUMN "meetingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "attachmentId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "taskId" TEXT,
    "ticketId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_attachmentId_key" ON "Ticket"("attachmentId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");

-- CreateIndex
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");

-- CreateIndex
CREATE INDEX "Comment_ticketId_idx" ON "Comment"("ticketId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MeetingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

