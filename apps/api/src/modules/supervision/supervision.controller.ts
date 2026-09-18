import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SupervisionService } from './supervision.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Supervisión')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supervision')
export class SupervisionController {
  constructor(private readonly supervisionService: SupervisionService) {}

  @Get()
  @Permissions(PERMISSIONS.SUPERVISION_VIEW)
  @ApiOperation({ summary: 'Listar visitas de supervisión' })
  findAll(@CurrentUser() user: AuthUser, @Query('date') date?: string, @Query('guardId') guardId?: string) {
    return this.supervisionService.findAll(user, { date, guardId });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.SUPERVISION_VIEW)
  @ApiOperation({ summary: 'Obtener visita' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.supervisionService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.SUPERVISION_CREATE)
  @ApiOperation({ summary: 'Crear visita de supervisión' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.supervisionService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.SUPERVISION_EDIT)
  @ApiOperation({ summary: 'Actualizar visita' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.supervisionService.update(user, id, body);
  }
}