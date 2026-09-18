import {
  Controller,
  Get,
  Body,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PERMISSIONS.USERS_VIEW)
  @ApiOperation({ summary: 'Listar usuarios de la empresa' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(user, { page, limit, search });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USERS_VIEW)
  @ApiOperation({ summary: 'Obtener usuario por id' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.USERS_CREATE)
  @ApiOperation({ summary: 'Crear usuario' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.usersService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.USERS_EDIT)
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.usersService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.USERS_DELETE)
  @ApiOperation({ summary: 'Desactivar usuario (soft)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(user, id);
  }

  @Put(':id/toggle-active')
  @Permissions(PERMISSIONS.USERS_EDIT)
  @ApiOperation({ summary: 'Activar/desactivar usuario' })
  toggleActive(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { active: boolean },
  ) {
    return this.usersService.toggleActive(user, id, body.active);
  }

  @Get(':id/login-history')
  @Permissions(PERMISSIONS.USERS_VIEW)
  @ApiOperation({ summary: 'Historial de accesos del usuario' })
  loginHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getLoginHistory(id);
  }
}