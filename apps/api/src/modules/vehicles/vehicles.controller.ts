import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Permissions(PERMISSIONS.VEHICLES_VIEW)
  @ApiOperation({ summary: 'Listar vehículos' })
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.vehiclesService.findAll(user, search);
  }

  @Get('expiring-insurance')
  @Permissions(PERMISSIONS.VEHICLES_VIEW)
  @ApiOperation({ summary: 'Seguros próximos a vencer' })
  expiringInsurance(@CurrentUser() user: AuthUser, @Query('days') days = '30') {
    return this.vehiclesService.expiringInsurance(user, days);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.VEHICLES_VIEW)
  @ApiOperation({ summary: 'Obtener vehículo' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.VEHICLES_CREATE)
  @ApiOperation({ summary: 'Registrar vehículo' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.vehiclesService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.VEHICLES_EDIT)
  @ApiOperation({ summary: 'Actualizar vehículo' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.vehiclesService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.VEHICLES_DELETE)
  @ApiOperation({ summary: 'Eliminar vehículo (soft)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(user, id);
  }
}