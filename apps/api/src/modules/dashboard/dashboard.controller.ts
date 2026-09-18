import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Indicadores principales del tablero' })
  getOverview(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getOverview(user);
  }

  @Get('guard-hub')
  @ApiOperation({ summary: 'Vista principal del guardia (turno actual)' })
  getGuardHub(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getGuardHub(user);
  }
}