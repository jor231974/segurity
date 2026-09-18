import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LogbookService } from './logbook.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Bitácora')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('logbook')
export class LogbookController {
  constructor(private readonly logbookService: LogbookService) {}

  @Get()
  @Permissions(PERMISSIONS.LOGBOOK_VIEW)
  @ApiOperation({ summary: 'Listar registros de bitácora' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('guardId') guardId?: string,
    @Query('postId') postId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.logbookService.findAll(user, { date, guardId, postId, page, limit });
  }

  @Get('mine')
  @Permissions(PERMISSIONS.LOGBOOK_CREATE)
  @ApiOperation({ summary: 'Mi bitácora (guardia)' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.logbookService.findMine(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LOGBOOK_VIEW)
  @ApiOperation({ summary: 'Obtener registro de bitácora' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.logbookService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.LOGBOOK_CREATE)
  @ApiOperation({ summary: 'Crear registro de bitácora' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.logbookService.create(user, body);
  }

  @Post('sync')
  @Permissions(PERMISSIONS.LOGBOOK_CREATE)
  @ApiOperation({ summary: 'Sincronizar bitácora offline' })
  sync(@CurrentUser() user: AuthUser, @Body() body: { records: any[] }) {
    return this.logbookService.sync(user, body.records);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.LOGBOOK_EDIT)
  @ApiOperation({ summary: 'Actualizar registro (queda en auditoría)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.logbookService.update(user, id, body);
  }
}