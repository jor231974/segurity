import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class LogbookService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { date?: string; guardId?: string; postId?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page ?? '') || 1;
    const limit = parseInt(query.limit ?? '') || 30;
    const where: any = { guard: { companyId: user.companyId } };
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.createdAt = { gte: start, lte: end };
    }
    if (query.guardId) where.guardId = query.guardId;
    if (query.postId) where.postId = query.postId;

    const [total, items] = await Promise.all([
      this.prisma.logbookEntry.count({ where }),
      this.prisma.logbookEntry.findMany({
        where,
        include: {
          guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          post: { include: { site: { select: { id: true, name: true } } } },
          files: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page, limit, items };
  }

  async findMine(user: AuthUser) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    return this.prisma.logbookEntry.findMany({
      where: { guardId: user.guardId },
      include: {
        post: { include: { site: { select: { id: true, name: true } } } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(user: AuthUser, id: string) {
    const entry = await this.prisma.logbookEntry.findUnique({
      where: { id },
      include: {
        guard: true,
        post: { include: { site: true } },
        shift: true,
        files: true,
      },
    });
    if (!entry) throw new NotFoundException('Registro no encontrado');
    if (entry.guard.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    return entry;
  }

  async create(user: AuthUser, body: any) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (!body.description) throw new BadRequestException('Descripción requerida');

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const shift = await this.prisma.shift.findFirst({
      where: {
        guardId: user.guardId,
        date: new Date(todayStr + 'T00:00:00.000Z'),
        status: { in: ['programado', 'activo'] },
      },
      orderBy: { startTime: 'asc' },
    });

    return this.prisma.logbookEntry.create({
      data: {
        guardId: user.guardId,
        postId: body.postId || shift?.postId || null,
        shiftId: body.shiftId || shift?.id || null,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        synced: false,
        files: body.files?.length
          ? {
              create: body.files.map((f: any) => ({
                url: f.url,
                mimeType: f.mimeType || 'image/jpeg',
                size: f.size || 0,
              })),
            }
          : undefined,
      },
      include: { files: true },
    });
  }

  async sync(user: AuthUser, records: any[]) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (!Array.isArray(records) || records.length === 0) return { synced: 0 };
    const results: string[] = [];
    const errors: { message: string; createdAt?: any }[] = [];

    for (const rec of records) {
      try {
        const timestamp = new Date(rec.timestamp || rec.createdAt);
        const dup = await this.prisma.logbookEntry.findFirst({
          where: {
            guardId: user.guardId,
            createdAt: { gte: new Date(timestamp.getTime() - 60000), lte: new Date(timestamp.getTime() + 60000) },
          },
        });
        if (dup) {
          errors.push({ createdAt: rec.createdAt, message: 'Ya existe' });
          continue;
        }
        const created = await this.prisma.logbookEntry.create({
          data: {
            guardId: user.guardId,
            postId: rec.postId || null,
            shiftId: rec.shiftId || null,
            description: rec.description,
            latitude: rec.latitude,
            longitude: rec.longitude,
            createdAt: timestamp,
            synced: true,
          },
        });
        results.push(created.id);
      } catch (e) {
        errors.push({ message: (e as Error).message });
      }
    }
    return { synced: results.length, errors };
  }

  async update(user: AuthUser, id: string, body: any) {
    const entry = await this.prisma.logbookEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Registro no encontrado');
    if (entry.guardId !== user.guardId && !user.permissions.includes('logbook.edit')) {
      throw new ForbiddenException('Permiso denegado');
    }

    // Registrar auditoría de la modificación (se registra en AuditLog vía interceptor)
    return this.prisma.logbookEntry.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
      },
    });
  }
}