import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientRequestsService } from './client-requests.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Solicitudes del cliente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('client-requests')
export class ClientRequestsController {
  constructor(private readonly service: ClientRequestsService) {}

  @Get()
  @Permissions(PERMISSIONS.CLIENT_REQUEST_VIEW)
  @ApiOperation({ summary: 'Listar solicitudes (empresa)' })
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.service.findAll(user, { status, clientId });
  }

  @Get('mine')
  @Permissions(PERMISSIONS.CLIENT_REQUEST_VIEW)
  @ApiOperation({ summary: 'Mis solicitudes (cliente)' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CLIENT_REQUEST_VIEW)
  @ApiOperation({ summary: 'Obtener solicitud' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.CLIENT_REQUEST_CREATE)
  @ApiOperation({ summary: 'Crear solicitud (cliente)' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.create(user, body);
  }

  @Put(':id/respond')
  @Permissions(PERMISSIONS.CLIENT_REQUEST_HANDLE)
  @ApiOperation({ summary: 'Responder solicitud (empresa)' })
  respond(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.service.respond(user, id, body);
  }
}