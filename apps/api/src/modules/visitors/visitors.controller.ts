import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Visitantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Get()
  @Permissions(PERMISSIONS.VISITORS_VIEW)
  @ApiOperation({ summary: 'Listar visitantes' })
  findAll(@CurrentUser() user: AuthUser, @Query('siteId') siteId?: string, @Query('date') date?: string, @Query('inside') inside?: string) {
    return this.visitorsService.findAll(user, { siteId, date, inside });
  }

  @Get('inside')
  @Permissions(PERMISSIONS.VISITORS_VIEW)
  @ApiOperation({ summary: 'Visitantes actualmente dentro de la instalación' })
  getInside(@CurrentUser() user: AuthUser, @Query('siteId') siteId?: string) {
    return this.visitorsService.getInside(user, siteId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.VISITORS_VIEW)
  @ApiOperation({ summary: 'Obtener visitante' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.VISITORS_CREATE)
  @ApiOperation({ summary: 'Registrar entrada de visitante' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.visitorsService.create(user, body);
  }

  @Put(':id/exit')
  @Permissions(PERMISSIONS.VISITORS_EDIT)
  @ApiOperation({ summary: 'Registrar salida del visitante' })
  registerExit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.registerExit(user, id);
  }
}