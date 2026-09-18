-- AlterTable
ALTER TABLE "guards" ADD COLUMN     "assignedClientId" UUID;

-- CreateTable
CREATE TABLE "guard_assignments" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "fromClientId" UUID,
    "toClientId" UUID NOT NULL,
    "reason" TEXT,
    "changedById" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guard_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guard_assignments_companyId_idx" ON "guard_assignments"("companyId");

-- CreateIndex
CREATE INDEX "guard_assignments_guardId_idx" ON "guard_assignments"("guardId");

-- CreateIndex
CREATE INDEX "guard_assignments_toClientId_idx" ON "guard_assignments"("toClientId");

-- CreateIndex
CREATE INDEX "guards_assignedClientId_idx" ON "guards"("assignedClientId");

-- AddForeignKey
ALTER TABLE "guards" ADD CONSTRAINT "guards_assignedClientId_fkey" FOREIGN KEY ("assignedClientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_assignments" ADD CONSTRAINT "guard_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_assignments" ADD CONSTRAINT "guard_assignments_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_assignments" ADD CONSTRAINT "guard_assignments_fromClientId_fkey" FOREIGN KEY ("fromClientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_assignments" ADD CONSTRAINT "guard_assignments_toClientId_fkey" FOREIGN KEY ("toClientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_assignments" ADD CONSTRAINT "guard_assignments_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
