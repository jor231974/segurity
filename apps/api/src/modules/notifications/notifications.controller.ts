import { Controller, Get, Put, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones' })
  findAll(@CurrentUser() user: AuthUser, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.findAll(user, unreadOnly === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contador de no leídas' })
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.unreadCount(user);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marcar como leída' })
  markRead(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(user, id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user);
  }
}