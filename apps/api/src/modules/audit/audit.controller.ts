import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT_VIEW)
  @ApiOperation({ summary: 'Listar registros de auditoría' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('module') module?: string,
    @Query('userId') userId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.auditService.findAll(user, { from, to, module, userId, page, limit });
  }
}