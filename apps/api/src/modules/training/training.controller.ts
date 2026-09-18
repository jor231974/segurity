import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Capacitación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get()
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Listar capacitaciones' })
  findAll(@CurrentUser() user: AuthUser, @Query('guardId') guardId?: string) {
    return this.trainingService.findAll(user, guardId);
  }

  @Get('expiring')
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Capacitaciones próximas a vencer' })
  expiring(@CurrentUser() user: AuthUser, @Query('days') days = '60') {
    return this.trainingService.findExpiring(user, days);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Obtener capacitación' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Registrar capacitación' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.trainingService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Actualizar capacitación' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.trainingService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Eliminar capacitación' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.remove(user, id);
  }
}