import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatrolsService } from './patrols.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Rondines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patrols')
export class PatrolsController {
  constructor(private readonly patrolsService: PatrolsService) {}

  @Get('routes')
  @Permissions(PERMISSIONS.PATROLS_VIEW)
  @ApiOperation({ summary: 'Listar rutas de rondín' })
  getRoutes(@CurrentUser() user: AuthUser, @Query('siteId') siteId?: string) {
    return this.patrolsService.getRoutes(user, siteId);
  }

  @Post('routes')
  @Permissions(PERMISSIONS.PATROLS_CREATE)
  @ApiOperation({ summary: 'Crear ruta de rondín' })
  createRoute(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.patrolsService.createRoute(user, body);
  }

  @Get('routes/mine')
  @Permissions(PERMISSIONS.PATROLS_CREATE)
  @ApiOperation({ summary: 'Mis rutas de rondín de hoy (guardia)' })
  getMyRoutes(@CurrentUser() user: AuthUser) {
    return this.patrolsService.getMyRoutes(user);
  }

  @Get('routes/:id')
  @Permissions(PERMISSIONS.PATROLS_VIEW)
  @ApiOperation({ summary: 'Obtener ruta' })
  getRoute(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.patrolsService.getRoute(user, id);
  }

  @Put('routes/:id')
  @Permissions(PERMISSIONS.PATROLS_EDIT)
  @ApiOperation({ summary: 'Actualizar ruta' })
  updateRoute(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.patrolsService.updateRoute(user, id, body);
  }

  @Delete('routes/:id')
  @Permissions(PERMISSIONS.PATROLS_DELETE)
  @ApiOperation({ summary: 'Eliminar ruta' })
  removeRoute(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.patrolsService.removeRoute(user, id);
  }

  @Get()
  @Permissions(PERMISSIONS.PATROLS_VIEW)
  @ApiOperation({ summary: 'Listar check-ins de rondín' })
  getCheckIns(
    @CurrentUser() user: AuthUser,
    @Query('routeId') routeId?: string,
    @Query('guardId') guardId?: string,
    @Query('date') date?: string,
  ) {
    return this.patrolsService.getCheckIns(user, { routeId, guardId, date });
  }

  @Post('checkin')
  @Permissions(PERMISSIONS.PATROLS_CREATE)
  @ApiOperation({ summary: 'Guardia registra punto de rondín' })
  checkIn(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.patrolsService.checkIn(user, body);
  }

  @Post('checkin/sync')
  @Permissions(PERMISSIONS.PATROLS_CREATE)
  @ApiOperation({ summary: 'Sincronizar rondines offline' })
  syncCheckIns(@CurrentUser() user: AuthUser, @Body() body: { records: any[] }) {
    return this.patrolsService.syncCheckIns(user, body.records);
  }

  @Get('status')
  @Permissions(PERMISSIONS.PATROLS_VIEW)
  @ApiOperation({ summary: 'Estado de rondines por fecha' })
  getStatus(@CurrentUser() user: AuthUser, @Query('date') date: string) {
    return this.patrolsService.getStatus(user, date);
  }
}