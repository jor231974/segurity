import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, unreadOnly: boolean) {
    const where: any = { userId: user.id };
    if (unreadOnly) where.readAt = null;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(user: AuthUser) {
    return this.prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
  }

  async markRead(user: AuthUser, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(user: AuthUser) {
    return this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }
}