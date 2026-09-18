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
import { GuardsService } from './guards.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Guardias / Elementos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('guards')
export class GuardsController {
  constructor(private readonly guardsService: GuardsService) {}

  @Get()
  @Permissions(PERMISSIONS.GUARDS_VIEW)
  @ApiOperation({ summary: 'Listar guardias' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.guardsService.findAll(user, { page, limit, search, status, zoneId });
  }

  @Get('me')
  @ApiOperation({ summary: 'Mi expediente como guardia' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.guardsService.findByUserId(user);
  }

  @Get('map')
  @Permissions(PERMISSIONS.GPS_VIEW)
  @ApiOperation({ summary: 'Guardias con última ubicación (mapa)' })
  getForMap(@CurrentUser() user: AuthUser) {
    return this.guardsService.getForMap(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.GUARDS_VIEW)
  @ApiOperation({ summary: 'Obtener guardia completo' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.guardsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.GUARDS_CREATE)
  @ApiOperation({ summary: 'Crear guardia' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.guardsService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.GUARDS_EDIT)
  @ApiOperation({ summary: 'Actualizar guardia' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.guardsService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.GUARDS_DELETE)
  @ApiOperation({ summary: 'Eliminar guardia (soft)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.guardsService.remove(user, id);
  }

  @Get(':id/documents')
  @Permissions(PERMISSIONS.GUARDS_DOCUMENTS)
  @ApiOperation({ summary: 'Documentos del guardia' })
  getDocuments(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.guardsService.getDocuments(user, id);
  }

  @Post(':id/documents')
  @Permissions(PERMISSIONS.GUARDS_DOCUMENTS)
  @ApiOperation({ summary: 'Agregar documento al guardia' })
  addDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.guardsService.addDocument(user, id, body);
  }

  @Get(':id/trainings')
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Capacitación del guardia' })
  getTrainings(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.guardsService.getTrainings(user, id);
  }

  @Post(':id/trainings')
  @Permissions(PERMISSIONS.GUARDS_TRAINING)
  @ApiOperation({ summary: 'Registrar capacitación del guardia' })
  addTraining(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.guardsService.addTraining(user, id, body);
  }

  @Get(':id/subordinates')
  @Permissions(PERMISSIONS.GUARDS_VIEW)
  @ApiOperation({ summary: 'Guardias a cargo del guardia (si es supervisor)' })
  getSubordinates(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.guardsService.getSubordinates(user, id);
  }
}