import { Controller, Get, Body, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Empresa y configuración')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @Permissions(PERMISSIONS.COMPANIES_VIEW)
  @ApiOperation({ summary: 'Obtener la empresa del usuario autenticado' })
  getMyCompany(@CurrentUser() user: AuthUser) {
    return this.companiesService.getById(user.companyId);
  }

  @Put('me')
  @Permissions(PERMISSIONS.COMPANIES_EDIT)
  @ApiOperation({ summary: 'Actualizar datos de la empresa' })
  updateMyCompany(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.companiesService.update(user.companyId, body);
  }

  @Get('me/settings')
  @Permissions(PERMISSIONS.COMPANIES_VIEW)
  @ApiOperation({ summary: 'Obtener configuración de la empresa' })
  getSettings(@CurrentUser() user: AuthUser) {
    return this.companiesService.getSettings(user.companyId);
  }

  @Put('me/settings')
  @Permissions(PERMISSIONS.COMPANIES_SETTINGS)
  @ApiOperation({ summary: 'Actualizar configuración de la empresa' })
  updateSettings(@CurrentUser() user: AuthUser, @Body() body: Record<string, any>) {
    return this.companiesService.updateSettings(user.companyId, body);
  }

  @Get('me/branches')
  @Permissions(PERMISSIONS.COMPANIES_VIEW)
  @ApiOperation({ summary: 'Listar sucursales' })
  getBranches(@CurrentUser() user: AuthUser) {
    return this.companiesService.getBranches(user.companyId);
  }

  @Post('me/branches')
  @Permissions(PERMISSIONS.COMPANIES_SETTINGS)
  @ApiOperation({ summary: 'Crear sucursal' })
  createBranch(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.companiesService.createBranch(user.companyId, body);
  }

  @Get('me/zones')
  @Permissions(PERMISSIONS.COMPANIES_VIEW)
  @ApiOperation({ summary: 'Listar zonas' })
  getZones(@CurrentUser() user: AuthUser) {
    return this.companiesService.getZones(user.companyId);
  }

  @Post('me/zones')
  @Permissions(PERMISSIONS.COMPANIES_SETTINGS)
  @ApiOperation({ summary: 'Crear zona' })
  createZone(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.companiesService.createZone(user.companyId, body);
  }

  @Get('me/incident-types')
  @Permissions(PERMISSIONS.COMPANIES_VIEW)
  @ApiOperation({ summary: 'Listar tipos de incidencia configurables' })
  getIncidentTypes(@CurrentUser() user: AuthUser) {
    return this.companiesService.getIncidentTypes(user.companyId);
  }

  @Post('me/incident-types')
  @Permissions(PERMISSIONS.COMPANIES_SETTINGS)
  @ApiOperation({ summary: 'Crear tipo de incidencia' })
  createIncidentType(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.companiesService.createIncidentType(user.companyId, body);
  }
}