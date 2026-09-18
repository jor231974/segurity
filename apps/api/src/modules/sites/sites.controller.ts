import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Instalaciones (sitios)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @Permissions(PERMISSIONS.SITES_VIEW)
  @ApiOperation({ summary: 'Listar instalaciones' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.sitesService.findAll(user);
  }

  @Get('map')
  @Permissions(PERMISSIONS.SITES_VIEW)
  @ApiOperation({ summary: 'Instalaciones para mapa (con coordenadas)' })
  findForMap(@CurrentUser() user: AuthUser) {
    return this.sitesService.findForMap(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.SITES_VIEW)
  @ApiOperation({ summary: 'Obtener instalación' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.SITES_CREATE)
  @ApiOperation({ summary: 'Crear instalación' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.sitesService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.SITES_EDIT)
  @ApiOperation({ summary: 'Actualizar instalación' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.sitesService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.SITES_DELETE)
  @ApiOperation({ summary: 'Eliminar instalación (soft)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.remove(user, id);
  }

  @Get(':id/posts')
  @Permissions(PERMISSIONS.POSTS_VIEW)
  @ApiOperation({ summary: 'Puestos de la instalación' })
  getPosts(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.getPosts(user, id);
  }
}