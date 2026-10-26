-- CreateEnum
CREATE TYPE "CircularCategory" AS ENUM ('ADMINISTRATIVE', 'HR', 'FINANCE', 'OPERATIONS', 'IT', 'GENERAL');

-- CreateEnum
CREATE TYPE "CircularAudience" AS ENUM ('ALL', 'DEPARTMENTS', 'PEOPLE');

-- CreateTable
CREATE TABLE "Circular" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "CircularCategory" NOT NULL,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "audience" "CircularAudience" NOT NULL,
    "issuerId" TEXT NOT NULL,
    "expiresAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Circular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircularDepartment" (
    "circularId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "CircularDepartment_pkey" PRIMARY KEY ("circularId","departmentId")
);

-- CreateTable
CREATE TABLE "CircularRecipient" (
    "circularId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "remindedAt" TIMESTAMP(3),

    CONSTRAINT "CircularRecipient_pkey" PRIMARY KEY ("circularId","userId")
);

-- CreateTable
CREATE TABLE "CircularAttachment" (
    "id" TEXT NOT NULL,
    "circularId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "CircularAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Circular_createdAt_idx" ON "Circular"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Circular_year_seq_key" ON "Circular"("year", "seq");

-- CreateIndex
CREATE INDEX "CircularRecipient_userId_readAt_idx" ON "CircularRecipient"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "CircularAttachment_fileId_key" ON "CircularAttachment"("fileId");

-- AddForeignKey
ALTER TABLE "Circular" ADD CONSTRAINT "Circular_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularDepartment" ADD CONSTRAINT "CircularDepartment_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "Circular"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularDepartment" ADD CONSTRAINT "CircularDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularRecipient" ADD CONSTRAINT "CircularRecipient_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "Circular"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularRecipient" ADD CONSTRAINT "CircularRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularAttachment" ADD CONSTRAINT "CircularAttachment_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "Circular"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularAttachment" ADD CONSTRAINT "CircularAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

