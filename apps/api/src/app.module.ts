import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { SitesModule } from './modules/sites/sites.module';
import { PostsModule } from './modules/posts/posts.module';
import { ConsignsModule } from './modules/consigns/consigns.module';
import { GuardsModule } from './modules/guards/guards.module';
import { TrainingModule } from './modules/training/training.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GpsModule } from './modules/gps/gps.module';
import { PatrolsModule } from './modules/patrols/patrols.module';
import { LogbookModule } from './modules/logbook/logbook.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { SosModule } from './modules/sos/sos.module';
import { SupervisionModule } from './modules/supervision/supervision.module';
import { VideoModule } from './modules/video/video.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PrepayrollModule } from './modules/prepayroll/prepayroll.module';
import { BillingModule } from './modules/billing/billing.module';
import { ClientRequestsModule } from './modules/client-requests/client-requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    RolesModule,
    ClientsModule,
    ContractsModule,
    SitesModule,
    PostsModule,
    ConsignsModule,
    GuardsModule,
    TrainingModule,
    ShiftsModule,
    AttendanceModule,
    GpsModule,
    PatrolsModule,
    LogbookModule,
    IncidentsModule,
    SosModule,
    SupervisionModule,
    VideoModule,
    VisitorsModule,
    VehiclesModule,
    InventoryModule,
    PrepayrollModule,
    BillingModule,
    ClientRequestsModule,
    NotificationsModule,
    ReportsModule,
    AuditModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}