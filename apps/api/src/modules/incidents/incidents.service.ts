import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    return { incident, companyId: incident?.companyId ?? null };
  }

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser, query: { status?: string; severity?: string; date?: string; guardId?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page ?? '') || 1;
    const limit = parseInt(query.limit ?? '') || 20;
    const where: any = { companyId: user.companyId };
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.guardId) where.reporterId = query.guardId;
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.createdAt = { gte: start, lte: end };
    }

    const [total, items] = await Promise.all([
      this.prisma.incident.count({ where }),
      this.prisma.incident.findMany({
        where,
        include: {
          type: { select: { id: true, name: true, color: true } },
          reporter: { select: { id: true, firstName: true, lastName: true } },
          supervisor: { select: { id: true, name: true, lastName: true } },
          files: true,
          videos: true,
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
    return this.prisma.incident.findMany({
      where: { reporterId: user.guardId },
      include: {
        type: { select: { id: true, name: true, color: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(user: AuthUser, id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        type: true,
        reporter: true,
        supervisor: true,
        shift: { include: { post: { include: { site: true } } } },
        files: true,
        videos: { include: { downloads: true } },
        actions: { include: { performedBy: { select: { name: true, lastName: true } } } },
      },
    });
    if (!incident) throw new NotFoundException('Incidencia no encontrada');
    await this.assertAccess(user, incident.companyId);
    return incident;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    if (!user.guardId && !user.permissions.includes('incidents.create')) {
      throw new BadRequestException('Debe ser guardia o tener permiso para crear incidencias');
    }
    if (!body.description) throw new BadRequestException('Descripción requerida');

    const guard = user.guardId
      ? await this.prisma.guard.findUnique({ where: { id: user.guardId } })
      : null;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const shift = guard
      ? await this.prisma.shift.findFirst({
          where: {
            guardId: guard.id,
            date: new Date(todayStr + 'T00:00:00.000Z'),
            status: { in: ['programado', 'activo'] },
          },
          orderBy: { startTime: 'asc' },
        })
      : null;

    const typeName =
      body.typeName ||
      (body.typeId ? (await this.prisma.incidentType.findUnique({ where: { id: body.typeId } }))?.name : undefined) ||
      'otra';

    const incident = await this.prisma.incident.create({
      data: {
        companyId: user.companyId,
        typeId: body.typeId || null,
        typeName,
        severity: body.severity || 'media',
        status: 'abierta',
        description: body.description,
        reporterId: guard?.id || body.reporterGuardId || (await this.findFirstGuard(user.companyId))?.id,
        guardId: guard?.id || null,
        shiftId: shift?.id || body.shiftId || null,
        latitude: body.latitude,
        longitude: body.longitude,
        involvedPersons: body.involvedPersons,
        witnesses: body.witnesses,
        actionsTaken: body.actionsTaken,
        synced: false,
        files: body.files?.length
          ? { create: body.files.map((f: any) => ({ url: f.url, mimeType: f.mimeType || 'image/jpeg', size: f.size || 0 })) }
          : undefined,
      },
      include: { reporter: true, shift: { include: { post: true } } },
    });

    // Notificación a monitores y supervisores
    if (['alta', 'critica'].includes(incident.severity)) {
      await this.notifyUsers(user.companyId, 'incidente_critico',
        `Incidencia ${incident.severity}: ${incident.typeName}`,
        incident.description, { incidentId: incident.id });
    }

    return incident;
  }

  private async findFirstGuard(companyId: string) {
    return this.prisma.guard.findFirst({ where: { companyId, deletedAt: null } });
  }

  private async notifyUsers(companyId: string, type: string, title: string, body: string, data: any) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          companyId,
          userRoles: { some: { role: { code: { in: ['MONITOR', 'SUPERVISOR', 'ADMINISTRATOR', 'DIRECTOR'] } } } },
        },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          companyId,
          type,
          title,
          body,
          data: data as any,
        })),
      });
    } catch {
      // no romper por notificaciones
    }
  }

  async sync(user: AuthUser, records: any[]) {
    if (!Array.isArray(records) || records.length === 0) return { synced: 0 };
    const results: string[] = [];
    const errors: { message: string }[] = [];
    for (const rec of records) {
      try {
        const guard = user.guardId
          ? await this.prisma.guard.findUnique({ where: { id: user.guardId } })
          : null;
        if (!guard) throw new ForbiddenException('El usuario no es guardia');
        const created = await this.prisma.incident.create({
          data: {
            companyId: guard.companyId,
            typeId: null,
            typeName: rec.typeName || 'otra',
            severity: rec.severity || 'media',
            status: 'abierta',
            description: rec.description,
            reporterId: guard.id,
            guardId: guard.id,
            shiftId: rec.shiftId || null,
            latitude: rec.latitude,
            longitude: rec.longitude,
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
    const { incident, companyId } = await this.resolveCompany(id);
    if (!incident) throw new NotFoundException('Incidencia no encontrada');
    await this.assertAccess(user, companyId);

    return this.prisma.incident.update({
      where: { id },
      data: {
        ...(body.typeId !== undefined && { typeId: body.typeId }),
        ...(body.typeName && { typeName: body.typeName }),
        ...(body.severity && { severity: body.severity }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.involvedPersons !== undefined && { involvedPersons: body.involvedPersons }),
        ...(body.witnesses !== undefined && { witnesses: body.witnesses }),
        ...(body.actionsTaken !== undefined && { actionsTaken: body.actionsTaken }),
        ...(body.supervisorId !== undefined && { supervisorId: body.supervisorId }),
        ...(body.status && { status: body.status }),
      },
    });
  }

  async close(user: AuthUser, id: string, resolution?: string) {
    const { incident, companyId } = await this.resolveCompany(id);
    if (!incident) throw new NotFoundException('Incidencia no encontrada');
    await this.assertAccess(user, companyId);

    if (resolution) {
      await this.prisma.incidentAction.create({
        data: {
          incidentId: id,
          description: `Cierre: ${resolution}`,
          performedById: user.id,
        },
      });
    }

    return this.prisma.incident.update({
      where: { id },
      data: { status: 'cerrada', closedById: user.id, closedAt: new Date() },
    });
  }

  async addAction(user: AuthUser, id: string, body: { description: string }) {
    const { incident, companyId } = await this.resolveCompany(id);
    if (!incident) throw new NotFoundException('Incidencia no encontrada');
    await this.assertAccess(user, companyId);
    if (!body.description) throw new BadRequestException('Descripción requerida');

    return this.prisma.incidentAction.create({
      data: {
        incidentId: id,
        description: body.description,
        performedById: user.id,
      },
    });
  }
}