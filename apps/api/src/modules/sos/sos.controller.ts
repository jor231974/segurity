import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SosService } from './sos.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('SOS / Emergencia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sos')
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post()
  @Permissions(PERMISSIONS.SOS_CREATE)
  @ApiOperation({ summary: 'Activar alerta SOS (guardia)' })
  activate(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.sosService.activate(user, body);
  }

  @Get()
  @Permissions(PERMISSIONS.SOS_VIEW)
  @ApiOperation({ summary: 'Listar alertas SOS' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.sosService.findAll(user, { status, date });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.SOS_VIEW)
  @ApiOperation({ summary: 'Obtener alerta SOS' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sosService.findOne(user, id);
  }

  @Put(':id/ack')
  @Permissions(PERMISSIONS.SOS_HANDLE)
  @ApiOperation({ summary: 'Atender alerta SOS' })
  acknowledge(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sosService.acknowledge(user, id);
  }

  @Put(':id/close')
  @Permissions(PERMISSIONS.SOS_HANDLE)
  @ApiOperation({ summary: 'Cerrar alerta SOS' })
  close(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sosService.close(user, id);
  }
}