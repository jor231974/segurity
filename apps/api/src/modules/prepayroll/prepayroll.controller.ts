import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrepayrollService } from './prepayroll.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Pre-nómina')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('prepayroll')
export class PrepayrollController {
  constructor(private readonly prepayrollService: PrepayrollService) {}

  @Get()
  @Permissions(PERMISSIONS.PREPAYROLL_VIEW)
  @ApiOperation({ summary: 'Listar pre-nóminas' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.prepayrollService.findAll(user);
  }

  @Post('generate')
  @Permissions(PERMISSIONS.PREPAYROLL_GENERATE)
  @ApiOperation({ summary: 'Generar pre-nómina de un periodo' })
  generate(@CurrentUser() user: AuthUser, @Body() body: { periodStart: string; periodEnd: string }) {
    return this.prepayrollService.generate(user, body.periodStart, body.periodEnd);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PREPAYROLL_VIEW)
  @ApiOperation({ summary: 'Obtener pre-nómina con líneas' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.prepayrollService.findOne(user, id);
  }

  @Put(':id/status')
  @Permissions(PERMISSIONS.PREPAYROLL_GENERATE)
  @ApiOperation({ summary: 'Cambiar estado de la pre-nómina' })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    return this.prepayrollService.updateStatus(user, id, body.status);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PREPAYROLL_GENERATE)
  @ApiOperation({ summary: 'Eliminar pre-nómina' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.prepayrollService.remove(user, id);
  }

  @Get(':id/export')
  @Permissions(PERMISSIONS.PREPAYROLL_EXPORT)
  @ApiOperation({ summary: 'Exportar pre-nómina (CSV)' })
  export(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.prepayrollService.export(user, id);
  }
}