import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Asistencia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Permissions(PERMISSIONS.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Registros de asistencia' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('guardId') guardId?: string,
    @Query('shiftId') shiftId?: string,
  ) {
    return this.attendanceService.findAll(user, { date, guardId, shiftId });
  }

  @Get('my-today')
  @Permissions(PERMISSIONS.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Mis asistencias de hoy (guardia)' })
  myToday(@CurrentUser() user: AuthUser) {
    return this.attendanceService.myToday(user);
  }

  @Get('summary')
  @Permissions(PERMISSIONS.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Resumen diario de asistencia' })
  summary(@CurrentUser() user: AuthUser, @Query('date') date: string) {
    return this.attendanceService.summary(user, date);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Obtener registro de asistencia' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Registrar entrada/salida desde celular' })
  check(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.attendanceService.check(user, body);
  }

  @Post('sync')
  @Permissions(PERMISSIONS.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Sincronizar asistencias offline' })
  sync(@CurrentUser() user: AuthUser, @Body() body: { records: any[] }) {
    return this.attendanceService.sync(user, body.records);
  }
}