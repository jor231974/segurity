import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Roles y permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Listar roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @Permissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Listar todos los permisos disponibles' })
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get(':code/permissions')
  @Permissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Permisos de un rol' })
  getRolePermissions(code: string) {
    return this.rolesService.getRolePermissions(code);
  }
}