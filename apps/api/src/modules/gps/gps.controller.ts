import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('GPS y geocercas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('ping')
  @ApiOperation({ summary: 'Guardia reporta ubicación (móvil)' })
  ping(@CurrentUser() user: AuthUser, @Body() body: { latitude: number; longitude: number; accuracy?: number; device?: string }) {
    return this.gpsService.ping(user, body);
  }

  @Get('positions')
  @Permissions(PERMISSIONS.GPS_VIEW)
  @ApiOperation({ summary: 'Ultimas posiciones de guardias (mapa)' })
  positions(@CurrentUser() user: AuthUser) {
    return this.gpsService.positions(user);
  }

  @Get('history')
  @Permissions(PERMISSIONS.GPS_VIEW)
  @ApiOperation({ summary: 'Historial de posiciones de un guardia' })
  history(
    @CurrentUser() user: AuthUser,
    @Query('guardId') guardId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.gpsService.history(user, guardId, from, to);
  }
}