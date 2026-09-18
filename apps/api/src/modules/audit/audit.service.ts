import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { from?: string; to?: string; module?: string; userId?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page ?? '') || 1;
    const limit = parseInt(query.limit ?? '') || 50;
    const where: any = { companyId: user.companyId };

    if (query.from && query.to) {
      where.createdAt = { gte: new Date(query.from), lte: new Date(query.to) };
    } else if (query.from) {
      where.createdAt = { gte: new Date(query.from) };
    } else if (query.to) {
      where.createdAt = { lte: new Date(query.to) };
    }

    if (query.module) where.module = query.module;
    if (query.userId) where.userId = query.userId;

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, lastName: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, limit, items };
  }
}