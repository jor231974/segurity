import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de asistencia' })
  attendance(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string, @Query('guardId') guardId?: string) {
    return this.reportsService.attendance(user, from, to, guardId);
  }

  @Get('shifts')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de turnos' })
  shifts(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.shifts(user, from, to);
  }

  @Get('patrols')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de rondines' })
  patrols(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.patrols(user, from, to);
  }

  @Get('incidents')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de incidencias' })
  incidents(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string, @Query('status') status?: string) {
    return this.reportsService.incidents(user, from, to, status);
  }

  @Get('logbook')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de bitácora' })
  logbook(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.logbook(user, from, to);
  }

  @Get('billing')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de facturación' })
  billing(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.billing(user, from, to);
  }

  @Get('profitability')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Reporte de rentabilidad' })
  profitability(@CurrentUser() user: AuthUser) {
    return this.reportsService.profitability(user);
  }

  @Get('audit')
  @Permissions(PERMISSIONS.AUDIT_VIEW)
  @ApiOperation({ summary: 'Reporte de auditoría' })
  audit(@CurrentUser() user: AuthUser, @Query('from') from: string, @Query('to') to: string, @Query('module') module?: string) {
    return this.reportsService.audit(user, from, to, module);
  }

  @Post('generate')
  @Permissions(PERMISSIONS.REPORT_EXPORT)
  @ApiOperation({ summary: 'Generar y guardar un reporte' })
  generate(@CurrentUser() user: AuthUser, @Body() body: { name: string; type: string; from: string; to: string }) {
    return this.reportsService.generate(user, body);
  }
}