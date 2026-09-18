import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConsignsService } from './consigns.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Consignas / Órdenes de puesto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('consigns')
export class ConsignsController {
  constructor(private readonly consignsService: ConsignsService) {}

  @Get()
  @Permissions(PERMISSIONS.CONSIGNS_VIEW)
  @ApiOperation({ summary: 'Listar consignas' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('postId') postId?: string,
    @Query('guardId') guardId?: string,
  ) {
    return this.consignsService.findAll(user, postId, guardId);
  }

  @Get('mine')
  @Permissions(PERMISSIONS.CONSIGNS_VIEW)
  @ApiOperation({ summary: 'Consignas del guardia autenticado' })
  getMyConsigns(@CurrentUser() user: AuthUser) {
    return this.consignsService.getMyConsigns(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CONSIGNS_VIEW)
  @ApiOperation({ summary: 'Obtener consigna' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.consignsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.CONSIGNS_CREATE)
  @ApiOperation({ summary: 'Crear consigna' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.consignsService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.CONSIGNS_EDIT)
  @ApiOperation({ summary: 'Actualizar consigna (crea nueva versión)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.consignsService.update(user, id, body);
  }

  @Post(':id/ack')
  @Permissions(PERMISSIONS.CONSIGNS_VIEW)
  @ApiOperation({ summary: 'Guardia confirma lectura/aceptación' })
  ack(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.consignsService.ack(user, id);
  }
}