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
import { ClientsService } from './clients.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Permissions(PERMISSIONS.CLIENTS_VIEW)
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.clientsService.findAll(user, { page, limit, search, status });
  }

  @Get('mine')
  @Permissions(PERMISSIONS.CLIENT_PORTAL_ACCESS)
  @ApiOperation({ summary: 'Mi información como cliente (portal)' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.clientsService.getMine(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CLIENTS_VIEW)
  @ApiOperation({ summary: 'Obtener cliente' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.CLIENTS_CREATE)
  @ApiOperation({ summary: 'Crear cliente' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.clientsService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.CLIENTS_EDIT)
  @ApiOperation({ summary: 'Actualizar cliente' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.clientsService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.CLIENTS_DELETE)
  @ApiOperation({ summary: 'Eliminar cliente (soft)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(user, id);
  }

  @Get(':id/contracts')
  @Permissions(PERMISSIONS.CONTRACTS_VIEW)
  @ApiOperation({ summary: 'Contratos del cliente' })
  getContracts(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getContracts(user, id);
  }

  @Get(':id/sites')
  @Permissions(PERMISSIONS.SITES_VIEW)
  @ApiOperation({ summary: 'Instalaciones del cliente' })
  getSites(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getSites(user, id);
  }

  @Post(':id/contacts')
  @Permissions(PERMISSIONS.CLIENTS_EDIT)
  @ApiOperation({ summary: 'Agregar contacto al cliente' })
  addContact(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.clientsService.addContact(user, id, body);
  }
}