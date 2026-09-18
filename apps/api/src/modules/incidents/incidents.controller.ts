import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Incidencias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Permissions(PERMISSIONS.INCIDENTS_VIEW)
  @ApiOperation({ summary: 'Listar incidencias' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('date') date?: string,
    @Query('guardId') guardId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.incidentsService.findAll(user, { status, severity, date, guardId, page, limit });
  }

  @Get('mine')
  @Permissions(PERMISSIONS.INCIDENTS_CREATE)
  @ApiOperation({ summary: 'Mis incidencias (guardia)' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.incidentsService.findMine(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.INCIDENTS_VIEW)
  @ApiOperation({ summary: 'Obtener incidencia' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.INCIDENTS_CREATE)
  @ApiOperation({ summary: 'Crear incidencia (guardia)' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.incidentsService.create(user, body);
  }

  @Post('sync')
  @Permissions(PERMISSIONS.INCIDENTS_CREATE)
  @ApiOperation({ summary: 'Sincronizar incidencias offline' })
  sync(@CurrentUser() user: AuthUser, @Body() body: { records: any[] }) {
    return this.incidentsService.sync(user, body.records);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.INCIDENTS_EDIT)
  @ApiOperation({ summary: 'Actualizar incidencia' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.incidentsService.update(user, id, body);
  }

  @Put(':id/close')
  @Permissions(PERMISSIONS.INCIDENTS_CLOSE)
  @ApiOperation({ summary: 'Cerrar incidencia' })
  close(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: { resolution?: string }) {
    return this.incidentsService.close(user, id, body.resolution);
  }

  @Post(':id/actions')
  @Permissions(PERMISSIONS.INCIDENTS_EDIT)
  @ApiOperation({ summary: 'Registrar acción sobre la incidencia' })
  addAction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { description: string },
  ) {
    return this.incidentsService.addAction(user, id, body);
  }
}