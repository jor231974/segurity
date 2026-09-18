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
import { ShiftsService } from './shifts.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Turnos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @Permissions(PERMISSIONS.SHIFTS_VIEW)
  @ApiOperation({ summary: 'Listar turnos' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('postId') postId?: string,
    @Query('guardId') guardId?: string,
    @Query('status') status?: string,
  ) {
    return this.shiftsService.findAll(user, { date, postId, guardId, status });
  }

  @Get('events')
  @Permissions(PERMISSIONS.SHIFTS_VIEW)
  @ApiOperation({ summary: 'Turnos por rango de fechas (calendario)' })
  getEvents(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.shiftsService.getEvents(user, from, to);
  }

  @Get('coverage')
  @Permissions(PERMISSIONS.SHIFTS_VIEW)
  @ApiOperation({ summary: 'Cobertura de puestos' })
  getCoverage(@CurrentUser() user: AuthUser, @Query('date') date: string) {
    return this.shiftsService.getCoverage(user, date);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.SHIFTS_VIEW)
  @ApiOperation({ summary: 'Obtener turno' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.SHIFTS_CREATE)
  @ApiOperation({ summary: 'Crear turno' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.shiftsService.create(user, body);
  }

  @Post('bulk')
  @Permissions(PERMISSIONS.SHIFTS_CREATE)
  @ApiOperation({ summary: 'Crear múltiples turnos' })
  createBulk(@CurrentUser() user: AuthUser, @Body() body: { shifts: any[] }) {
    return this.shiftsService.createBulk(user, body.shifts);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.SHIFTS_EDIT)
  @ApiOperation({ summary: 'Actualizar turno' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.shiftsService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.SHIFTS_DELETE)
  @ApiOperation({ summary: 'Cancelar turno' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.remove(user, id);
  }
}