-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "commercialName" TEXT NOT NULL,
    "rfc" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "operationalParams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "contactName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "ip" TEXT,
    "userAgent" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "commercialName" TEXT NOT NULL,
    "rfc" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "taxData" JSONB,
    "commercialTerms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'activo',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "terms" TEXT,
    "billingFrequency" TEXT NOT NULL DEFAULT 'mensual',
    "status" TEXT NOT NULL DEFAULT 'activo',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_services" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "siteId" UUID,
    "name" TEXT NOT NULL,
    "guardCount" INTEGER NOT NULL DEFAULT 1,
    "tariff" DECIMAL(12,2) NOT NULL,
    "estimatedCost" DECIMAL(12,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "schedule" TEXT,
    "instructions" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shiftStart" TEXT NOT NULL,
    "shiftEnd" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consigns" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "authorId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consign_history" (
    "id" UUID NOT NULL,
    "consignId" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" UUID NOT NULL,

    CONSTRAINT "consign_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consign_acks" (
    "id" UUID NOT NULL,
    "consignId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "ackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consign_acks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guards" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "userId" UUID,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "secondLastName" TEXT,
    "photoUrl" TEXT,
    "curp" TEXT,
    "rfc" TEXT,
    "nss" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disponible',
    "zoneId" UUID,
    "supervisorId" UUID,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guard_documents" (
    "id" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'vigente',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guard_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "courseName" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'en_curso',
    "score" DOUBLE PRECISION,
    "certificateUrl" TEXT,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "serviceId" UUID,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'programado',
    "notes" TEXT,
    "replacementOf" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "shiftId" UUID,
    "postId" UUID,
    "serviceId" UUID,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "device" TEXT,
    "distanceFromSite" DOUBLE PRECISION,
    "geofenceResult" TEXT,
    "status" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_logs" (
    "id" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "device" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_routes" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "postId" UUID,
    "name" TEXT NOT NULL,
    "schedule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrol_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_checkpoints" (
    "id" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "patrol_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_check_ins" (
    "id" UUID NOT NULL,
    "checkpointId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "shiftId" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "method" TEXT NOT NULL DEFAULT 'gps',
    "result" TEXT NOT NULL DEFAULT 'ok',
    "photoUrl" TEXT,
    "notes" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "patrol_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook_entries" (
    "id" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "postId" UUID,
    "shiftId" UUID,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "logbook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook_files" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "logbook_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_types" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#ef4444',

    CONSTRAINT "incident_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "typeId" UUID,
    "typeName" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abierta',
    "description" TEXT NOT NULL,
    "reporterId" UUID NOT NULL,
    "guardId" UUID,
    "shiftId" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "involvedPersons" TEXT,
    "witnesses" TEXT,
    "actionsTaken" TEXT,
    "supervisorId" UUID,
    "closedById" UUID,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_actions" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "performedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_files" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "incident_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_alerts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "shiftId" UUID,
    "serviceId" UUID,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'activa',
    "handledById" UUID,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sos_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_visits" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "supervisorId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "postId" UUID,
    "checklist" JSONB NOT NULL,
    "observations" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervision_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_streams" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "shiftId" UUID,
    "serviceId" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'iniciada',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "viewerCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "video_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_recordings" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "streamId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "shiftId" UUID,
    "incidentId" UUID,
    "filePath" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'webm',
    "durationSec" INTEGER NOT NULL,
    "resolution" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "video_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_download_logs" (
    "id" UUID NOT NULL,
    "videoId" UUID NOT NULL,
    "streamId" UUID,
    "userId" UUID NOT NULL,
    "reason" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_download_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "identification" TEXT,
    "companyName" TEXT,
    "personVisited" TEXT NOT NULL,
    "vehiclePlate" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "registeredById" UUID,
    "guardId" UUID,
    "entryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "plates" TEXT NOT NULL,
    "vin" TEXT,
    "insuranceExpiration" TIMESTAMP(3),
    "currentMileage" INTEGER,
    "responsibleGuardId" UUID,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "brand" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disponible',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_assignments" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "guardId" UUID,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "returnedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_payrolls" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "contractId" UUID,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'borrador',
    "generatedById" UUID NOT NULL,
    "totalAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_payroll_lines" (
    "id" UUID NOT NULL,
    "prepayrollId" UUID NOT NULL,
    "guardId" UUID NOT NULL,
    "serviceId" UUID,
    "shiftId" UUID,
    "workDays" INTEGER NOT NULL DEFAULT 0,
    "workHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "absences" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "baseAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "overtimeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pre_payroll_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "serviceId" UUID,
    "clientId" UUID,
    "number" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'transferencia',
    "reference" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_requests" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'media',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abierta',
    "assignedToId" UUID,
    "response" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filters" JSONB,
    "generatedById" UUID NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "userId" UUID,
    "ip" TEXT,
    "device" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_companyId_idx" ON "branches"("companyId");

-- CreateIndex
CREATE INDEX "zones_companyId_idx" ON "zones"("companyId");

-- CreateIndex
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");

-- CreateIndex
CREATE INDEX "system_settings_companyId_idx" ON "system_settings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_companyId_key_key" ON "system_settings"("companyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "login_history_userId_idx" ON "login_history"("userId");

-- CreateIndex
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_userId_key" ON "client_users"("userId");

-- CreateIndex
CREATE INDEX "client_users_userId_idx" ON "client_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_clientId_userId_key" ON "client_users"("clientId", "userId");

-- CreateIndex
CREATE INDEX "contracts_companyId_idx" ON "contracts"("companyId");

-- CreateIndex
CREATE INDEX "contracts_clientId_idx" ON "contracts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_companyId_number_key" ON "contracts"("companyId", "number");

-- CreateIndex
CREATE INDEX "contract_services_contractId_idx" ON "contract_services"("contractId");

-- CreateIndex
CREATE INDEX "contract_services_siteId_idx" ON "contract_services"("siteId");

-- CreateIndex
CREATE INDEX "sites_clientId_idx" ON "sites"("clientId");

-- CreateIndex
CREATE INDEX "posts_siteId_idx" ON "posts"("siteId");

-- CreateIndex
CREATE INDEX "consigns_postId_idx" ON "consigns"("postId");

-- CreateIndex
CREATE INDEX "consign_history_consignId_idx" ON "consign_history"("consignId");

-- CreateIndex
CREATE INDEX "consign_acks_guardId_idx" ON "consign_acks"("guardId");

-- CreateIndex
CREATE UNIQUE INDEX "consign_acks_consignId_guardId_key" ON "consign_acks"("consignId", "guardId");

-- CreateIndex
CREATE UNIQUE INDEX "guards_employeeNumber_key" ON "guards"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "guards_userId_key" ON "guards"("userId");

-- CreateIndex
CREATE INDEX "guards_companyId_idx" ON "guards"("companyId");

-- CreateIndex
CREATE INDEX "guards_zoneId_idx" ON "guards"("zoneId");

-- CreateIndex
CREATE INDEX "guards_supervisorId_idx" ON "guards"("supervisorId");

-- CreateIndex
CREATE INDEX "guards_status_idx" ON "guards"("status");

-- CreateIndex
CREATE INDEX "guard_documents_guardId_idx" ON "guard_documents"("guardId");

-- CreateIndex
CREATE INDEX "guard_documents_expirationDate_idx" ON "guard_documents"("expirationDate");

-- CreateIndex
CREATE INDEX "trainings_guardId_idx" ON "trainings"("guardId");

-- CreateIndex
CREATE INDEX "trainings_expirationDate_idx" ON "trainings"("expirationDate");

-- CreateIndex
CREATE INDEX "shifts_guardId_idx" ON "shifts"("guardId");

-- CreateIndex
CREATE INDEX "shifts_postId_idx" ON "shifts"("postId");

-- CreateIndex
CREATE INDEX "shifts_date_idx" ON "shifts"("date");

-- CreateIndex
CREATE INDEX "attendances_guardId_idx" ON "attendances"("guardId");

-- CreateIndex
CREATE INDEX "attendances_shiftId_idx" ON "attendances"("shiftId");

-- CreateIndex
CREATE INDEX "attendances_timestamp_idx" ON "attendances"("timestamp");

-- CreateIndex
CREATE INDEX "gps_logs_guardId_timestamp_idx" ON "gps_logs"("guardId", "timestamp");

-- CreateIndex
CREATE INDEX "gps_logs_timestamp_idx" ON "gps_logs"("timestamp");

-- CreateIndex
CREATE INDEX "patrol_routes_siteId_idx" ON "patrol_routes"("siteId");

-- CreateIndex
CREATE INDEX "patrol_checkpoints_routeId_idx" ON "patrol_checkpoints"("routeId");

-- CreateIndex
CREATE INDEX "patrol_check_ins_checkpointId_idx" ON "patrol_check_ins"("checkpointId");

-- CreateIndex
CREATE INDEX "patrol_check_ins_guardId_idx" ON "patrol_check_ins"("guardId");

-- CreateIndex
CREATE INDEX "patrol_check_ins_timestamp_idx" ON "patrol_check_ins"("timestamp");

-- CreateIndex
CREATE INDEX "logbook_entries_guardId_idx" ON "logbook_entries"("guardId");

-- CreateIndex
CREATE INDEX "logbook_entries_postId_idx" ON "logbook_entries"("postId");

-- CreateIndex
CREATE INDEX "logbook_entries_createdAt_idx" ON "logbook_entries"("createdAt");

-- CreateIndex
CREATE INDEX "logbook_files_entryId_idx" ON "logbook_files"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "incident_types_companyId_name_key" ON "incident_types"("companyId", "name");

-- CreateIndex
CREATE INDEX "incidents_companyId_idx" ON "incidents"("companyId");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_createdAt_idx" ON "incidents"("createdAt");

-- CreateIndex
CREATE INDEX "incident_actions_incidentId_idx" ON "incident_actions"("incidentId");

-- CreateIndex
CREATE INDEX "incident_files_incidentId_idx" ON "incident_files"("incidentId");

-- CreateIndex
CREATE INDEX "sos_alerts_companyId_idx" ON "sos_alerts"("companyId");

-- CreateIndex
CREATE INDEX "sos_alerts_guardId_idx" ON "sos_alerts"("guardId");

-- CreateIndex
CREATE INDEX "sos_alerts_status_idx" ON "sos_alerts"("status");

-- CreateIndex
CREATE INDEX "supervision_visits_companyId_idx" ON "supervision_visits"("companyId");

-- CreateIndex
CREATE INDEX "supervision_visits_guardId_idx" ON "supervision_visits"("guardId");

-- CreateIndex
CREATE INDEX "supervision_visits_supervisorId_idx" ON "supervision_visits"("supervisorId");

-- CreateIndex
CREATE INDEX "video_streams_companyId_idx" ON "video_streams"("companyId");

-- CreateIndex
CREATE INDEX "video_streams_guardId_idx" ON "video_streams"("guardId");

-- CreateIndex
CREATE INDEX "video_streams_status_idx" ON "video_streams"("status");

-- CreateIndex
CREATE UNIQUE INDEX "video_recordings_streamId_key" ON "video_recordings"("streamId");

-- CreateIndex
CREATE INDEX "video_recordings_companyId_idx" ON "video_recordings"("companyId");

-- CreateIndex
CREATE INDEX "video_recordings_guardId_idx" ON "video_recordings"("guardId");

-- CreateIndex
CREATE INDEX "video_recordings_incidentId_idx" ON "video_recordings"("incidentId");

-- CreateIndex
CREATE INDEX "video_recordings_expiresAt_idx" ON "video_recordings"("expiresAt");

-- CreateIndex
CREATE INDEX "video_download_logs_videoId_idx" ON "video_download_logs"("videoId");

-- CreateIndex
CREATE INDEX "video_download_logs_userId_idx" ON "video_download_logs"("userId");

-- CreateIndex
CREATE INDEX "visitors_siteId_idx" ON "visitors"("siteId");

-- CreateIndex
CREATE INDEX "visitors_exitAt_idx" ON "visitors"("exitAt");

-- CreateIndex
CREATE INDEX "vehicles_companyId_idx" ON "vehicles"("companyId");

-- CreateIndex
CREATE INDEX "vehicles_responsibleGuardId_idx" ON "vehicles"("responsibleGuardId");

-- CreateIndex
CREATE INDEX "inventory_items_companyId_idx" ON "inventory_items"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_companyId_serialNumber_key" ON "inventory_items"("companyId", "serialNumber");

-- CreateIndex
CREATE INDEX "inventory_assignments_itemId_idx" ON "inventory_assignments"("itemId");

-- CreateIndex
CREATE INDEX "inventory_assignments_guardId_idx" ON "inventory_assignments"("guardId");

-- CreateIndex
CREATE INDEX "pre_payrolls_companyId_idx" ON "pre_payrolls"("companyId");

-- CreateIndex
CREATE INDEX "pre_payrolls_periodStart_periodEnd_idx" ON "pre_payrolls"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "pre_payroll_lines_prepayrollId_idx" ON "pre_payroll_lines"("prepayrollId");

-- CreateIndex
CREATE INDEX "pre_payroll_lines_guardId_idx" ON "pre_payroll_lines"("guardId");

-- CreateIndex
CREATE INDEX "invoices_companyId_idx" ON "invoices"("companyId");

-- CreateIndex
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_companyId_number_key" ON "invoices"("companyId", "number");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "client_requests_companyId_idx" ON "client_requests"("companyId");

-- CreateIndex
CREATE INDEX "client_requests_clientId_idx" ON "client_requests"("clientId");

-- CreateIndex
CREATE INDEX "client_requests_status_idx" ON "client_requests"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "reports_companyId_idx" ON "reports"("companyId");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_createdAt_idx" ON "audit_logs"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_services" ADD CONSTRAINT "contract_services_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_services" ADD CONSTRAINT "contract_services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consigns" ADD CONSTRAINT "consigns_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consigns" ADD CONSTRAINT "consigns_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consign_history" ADD CONSTRAINT "consign_history_consignId_fkey" FOREIGN KEY ("consignId") REFERENCES "consigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consign_history" ADD CONSTRAINT "consign_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consign_acks" ADD CONSTRAINT "consign_acks_consignId_fkey" FOREIGN KEY ("consignId") REFERENCES "consigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consign_acks" ADD CONSTRAINT "consign_acks_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guards" ADD CONSTRAINT "guards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guards" ADD CONSTRAINT "guards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guards" ADD CONSTRAINT "guards_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guards" ADD CONSTRAINT "guards_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "guards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_documents" ADD CONSTRAINT "guard_documents_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "contract_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_routes" ADD CONSTRAINT "patrol_routes_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_routes" ADD CONSTRAINT "patrol_routes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_checkpoints" ADD CONSTRAINT "patrol_checkpoints_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "patrol_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_check_ins" ADD CONSTRAINT "patrol_check_ins_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "patrol_checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_check_ins" ADD CONSTRAINT "patrol_check_ins_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_files" ADD CONSTRAINT "logbook_files_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "logbook_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_types" ADD CONSTRAINT "incident_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "incident_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "guards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_actions" ADD CONSTRAINT "incident_actions_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_actions" ADD CONSTRAINT "incident_actions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_files" ADD CONSTRAINT "incident_files_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_visits" ADD CONSTRAINT "supervision_visits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_visits" ADD CONSTRAINT "supervision_visits_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_visits" ADD CONSTRAINT "supervision_visits_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_visits" ADD CONSTRAINT "supervision_visits_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_streams" ADD CONSTRAINT "video_streams_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "video_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_download_logs" ADD CONSTRAINT "video_download_logs_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "video_recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_download_logs" ADD CONSTRAINT "video_download_logs_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "video_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_download_logs" ADD CONSTRAINT "video_download_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_responsibleGuardId_fkey" FOREIGN KEY ("responsibleGuardId") REFERENCES "guards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_assignments" ADD CONSTRAINT "inventory_assignments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_assignments" ADD CONSTRAINT "inventory_assignments_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payrolls" ADD CONSTRAINT "pre_payrolls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payrolls" ADD CONSTRAINT "pre_payrolls_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payrolls" ADD CONSTRAINT "pre_payrolls_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payroll_lines" ADD CONSTRAINT "pre_payroll_lines_prepayrollId_fkey" FOREIGN KEY ("prepayrollId") REFERENCES "pre_payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payroll_lines" ADD CONSTRAINT "pre_payroll_lines_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "guards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payroll_lines" ADD CONSTRAINT "pre_payroll_lines_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "contract_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_payroll_lines" ADD CONSTRAINT "pre_payroll_lines_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "contract_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
