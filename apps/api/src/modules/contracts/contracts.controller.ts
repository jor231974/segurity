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
import { ContractsService } from './contracts.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Contratos y servicios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Permissions(PERMISSIONS.CONTRACTS_VIEW)
  @ApiOperation({ summary: 'Listar contratos' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.contractsService.findAll(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CONTRACTS_VIEW)
  @ApiOperation({ summary: 'Obtener contrato' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.CONTRACTS_CREATE)
  @ApiOperation({ summary: 'Crear contrato' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.contractsService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.CONTRACTS_EDIT)
  @ApiOperation({ summary: 'Actualizar contrato' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.contractsService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.CONTRACTS_DELETE)
  @ApiOperation({ summary: 'Eliminar contrato (soft)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.remove(user, id);
  }

  @Post(':id/services')
  @Permissions(PERMISSIONS.CONTRACTS_CREATE)
  @ApiOperation({ summary: 'Agregar servicio al contrato' })
  addService(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.contractsService.addService(user, id, body);
  }

  @Get(':id/services')
  @Permissions(PERMISSIONS.CONTRACTS_VIEW)
  @ApiOperation({ summary: 'Servicios del contrato' })
  getServices(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.getServices(user, id);
  }

  @Get(':id/profitability')
  @Permissions(PERMISSIONS.CONTRACTS_VIEW)
  @ApiOperation({ summary: 'Rentabilidad estimada del contrato' })
  getProfitability(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.getProfitability(user, id);
  }
}