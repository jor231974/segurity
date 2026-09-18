import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Equipo e inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Permissions(PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Listar equipo' })
  findAll(@CurrentUser() user: AuthUser, @Query('type') type?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.inventoryService.findAll(user, { type, status, search });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Obtener equipo' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Registrar equipo' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.inventoryService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.INVENTORY_EDIT)
  @ApiOperation({ summary: 'Actualizar equipo' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.inventoryService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.INVENTORY_EDIT)
  @ApiOperation({ summary: 'Dar de baja equipo' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.remove(user, id);
  }

  @Post(':id/assign')
  @Permissions(PERMISSIONS.INVENTORY_ASSIGN)
  @ApiOperation({ summary: 'Asignar equipo a guardia' })
  assign(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.inventoryService.assign(user, id, body);
  }

  @Put('assignments/:assignmentId/return')
  @Permissions(PERMISSIONS.INVENTORY_ASSIGN)
  @ApiOperation({ summary: 'Registrar devolución de equipo' })
  returnItem(@CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: string) {
    return this.inventoryService.returnItem(user, assignmentId);
  }
}