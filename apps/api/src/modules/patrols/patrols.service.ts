import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { haversineDistanceKm } from '../../common/utils/geo';

@Injectable()
export class PatrolsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async getRoutes(user: AuthUser, siteId?: string) {
    const where: any = { site: { client: { companyId: user.companyId } } };
    if (siteId) where.siteId = siteId;
    return this.prisma.patrolRoute.findMany({
      where,
      include: {
        site: { select: { id: true, name: true } },
        post: { select: { id: true, name: true } },
        checkpoints: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRoute(user: AuthUser, id: string) {
    const route = await this.prisma.patrolRoute.findUnique({
      where: { id },
      include: {
        site: { include: { client: { select: { companyId: true } } } },
        post: true,
        checkpoints: { orderBy: { sequence: 'asc' } },
      },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    await this.assertAccess(user, route.site.client.companyId);
    return route;
  }

  async createRoute(user: AuthUser, body: any) {
    const site = await this.prisma.site.findUnique({
      where: { id: body.siteId },
      include: { client: { select: { companyId: true } } },
    });
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, site.client.companyId);

    if (!body.checkpoints?.length) throw new BadRequestException('Se requiere al menos un punto');

    return this.prisma.patrolRoute.create({
      data: {
        siteId: body.siteId,
        postId: body.postId || null,
        name: body.name,
        schedule: body.schedule,
        active: body.active ?? true,
        checkpoints: {
          create: body.checkpoints.map((cp: any, idx: number) => ({
            name: cp.name,
            sequence: cp.sequence ?? idx,
            latitude: cp.latitude,
            longitude: cp.longitude,
          })),
        },
      },
      include: { checkpoints: { orderBy: { sequence: 'asc' } } },
    });
  }

  async updateRoute(user: AuthUser, id: string, body: any) {
    const route = await this.prisma.patrolRoute.findUnique({
      where: { id },
      include: { site: { include: { client: { select: { companyId: true } } } } },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    await this.assertAccess(user, route.site.client.companyId);

    // Si vienen checkpoints, reconstruirlos
    if (body.checkpoints?.length) {
      await this.prisma.patrolCheckpoint.deleteMany({ where: { routeId: id } });
      await this.prisma.patrolCheckpoint.createMany({
        data: body.checkpoints.map((cp: any, idx: number) => ({
          routeId: id,
          name: cp.name,
          sequence: cp.sequence ?? idx,
          latitude: cp.latitude,
          longitude: cp.longitude,
        })),
      });
    }

    return this.prisma.patrolRoute.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.schedule !== undefined && { schedule: body.schedule }),
        ...(body.active !== undefined && { active: body.active }),
        ...(body.postId !== undefined && { postId: body.postId || null }),
      },
      include: { checkpoints: { orderBy: { sequence: 'asc' } } },
    });
  }

  async removeRoute(user: AuthUser, id: string) {
    const route = await this.prisma.patrolRoute.findUnique({
      where: { id },
      include: { site: { include: { client: { select: { companyId: true } } } } },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    await this.assertAccess(user, route.site.client.companyId);
    await this.prisma.patrolCheckpoint.deleteMany({ where: { routeId: id } });
    return this.prisma.patrolRoute.delete({ where: { id } });
  }

  async getCheckIns(user: AuthUser, query: { routeId?: string; guardId?: string; date?: string }) {
    const where: any = { guard: { companyId: user.companyId } };
    if (query.routeId) {
      const checkpoints = await this.prisma.patrolCheckpoint.findMany({
        where: { routeId: query.routeId },
        select: { id: true },
      });
      where.checkpointId = { in: checkpoints.map((c) => c.id) };
    }
    if (query.guardId) where.guardId = query.guardId;
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.timestamp = { gte: start, lte: end };
    }

    return this.prisma.patrolCheckIn.findMany({
      where,
      include: {
        checkpoint: { include: { route: { include: { site: true } } } },
        guard: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async checkIn(user: AuthUser, body: any) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (!body.checkpointId) throw new BadRequestException('checkpointId requerido');

    const checkpoint = await this.prisma.patrolCheckpoint.findUnique({
      where: { id: body.checkpointId },
      include: { route: { include: { site: true } } },
    });
    if (!checkpoint) throw new NotFoundException('Punto de control no encontrado');

    // Validar que el guardia tiene turno hoy en el sitio de la ruta
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const shift = await this.prisma.shift.findFirst({
      where: {
        guardId: user.guardId,
        date: new Date(todayStr + 'T00:00:00.000Z'),
        status: { in: ['programado', 'activo'] },
        post: { siteId: checkpoint.route.siteId },
      },
    });

    let result = 'ok';
    if (!shift) {
      const inRange = await this.prisma.patrolCheckIn.findFirst({
        where: { guardId: user.guardId, timestamp: { gte: new Date(now.getTime() - 24*3600*1000) } },
      });
      if (!inRange) result = 'fuera_de_ruta';
    }

    if (body.latitude && body.longitude && checkpoint.latitude && checkpoint.longitude) {
      const distM = haversineDistanceKm(body.latitude, body.longitude, checkpoint.latitude, checkpoint.longitude) * 1000;
      if (distM > 100) result = 'fuera_de_ruta';
    }

    return this.prisma.patrolCheckIn.create({
      data: {
        checkpointId: body.checkpointId,
        guardId: user.guardId,
        shiftId: shift?.id || null,
        latitude: body.latitude,
        longitude: body.longitude,
        method: body.method || 'gps',
        result,
        notes: body.notes,
        synced: false,
      },
      include: { checkpoint: { include: { route: true } } },
    });
  }

  async getMyRoutes(user: AuthUser) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const shift = await this.prisma.shift.findFirst({
      where: {
        guardId: user.guardId,
        date: new Date(todayStr + 'T00:00:00.000Z'),
        status: { in: ['programado', 'activo'] },
      },
      include: { post: { select: { siteId: true } } },
      orderBy: { startTime: 'asc' },
    });
    if (!shift?.post) return [];

    const routes = await this.prisma.patrolRoute.findMany({
      where: {
        site: { id: shift.post.siteId, client: { companyId: user.companyId } },
        active: true,
      },
      include: {
        site: { select: { id: true, name: true } },
        post: { select: { id: true, name: true } },
        checkpoints: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });

    const checkinIds = routes.flatMap((r) => r.checkpoints.map((c) => c.id));
    const done = await this.prisma.patrolCheckIn.findMany({
      where: {
        guardId: user.guardId,
        checkpointId: { in: checkinIds.length ? checkinIds : ['00000000-0000-0000-0000-000000000000'] },
        timestamp: { gte: new Date(todayStr + 'T00:00:00.000Z') },
      },
      select: { checkpointId: true, timestamp: true, result: true },
      orderBy: { timestamp: 'desc' },
    });

    return routes.map((r) => ({
      ...r,
      checkpoints: r.checkpoints.map((c) => {
        const ch = done.filter((d) => d.checkpointId === c.id);
        return { ...c, lastCheckIn: ch[0] || null };
      }),
    }));
  }

  async syncCheckIns(user: AuthUser, records: any[]) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (!Array.isArray(records) || records.length === 0) return { synced: 0 };
    const results: string[] = [];
    const errors: { message: string; checkpointId?: any }[] = [];

    for (const rec of records) {
      try {
        const timestamp = new Date(rec.timestamp);
        const dup = await this.prisma.patrolCheckIn.findFirst({
          where: {
            guardId: user.guardId,
            checkpointId: rec.checkpointId,
            timestamp: { gte: new Date(timestamp.getTime() - 60000), lte: new Date(timestamp.getTime() + 60000) },
          },
        });
        if (dup) {
          errors.push({ checkpointId: rec.checkpointId, message: 'Ya existe' });
          continue;
        }
        const created = await this.prisma.patrolCheckIn.create({
          data: {
            checkpointId: rec.checkpointId,
            guardId: user.guardId,
            shiftId: rec.shiftId || null,
            latitude: rec.latitude,
            longitude: rec.longitude,
            method: rec.method || 'gps',
            result: rec.result || 'ok',
            notes: rec.notes,
            timestamp,
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

  async getStatus(user: AuthUser, date: string) {
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');

    const routes = await this.prisma.patrolRoute.findMany({
      where: { site: { client: { companyId: user.companyId ?? undefined } }, active: true },
      include: { checkpoints: { orderBy: { sequence: 'asc' } } },
    });

    const checkIns = await this.prisma.patrolCheckIn.findMany({
      where: {
        guard: { companyId: user.companyId ?? undefined },
        timestamp: { gte: start, lte: end },
      },
      include: { checkpoint: true, guard: { select: { id: true, firstName: true, lastName: true } } },
    });

    return routes.map((route) => {
      const routeCheckIns = checkIns.filter((ci) =>
        route.checkpoints.some((c) => c.id === ci.checkpointId),
      );
      const completedPoints = new Set(routeCheckIns.map((ci) => ci.checkpointId)).size;
      const totalPoints = route.checkpoints.length;
      return {
        route: { id: route.id, name: route.name, schedule: route.schedule },
        totalPoints,
        completedPoints,
        status:
          completedPoints === 0 ? 'pendiente'
          : completedPoints >= totalPoints ? 'completado'
          : totalPoints > 2 && completedPoints >= totalPoints - 1 ? 'completado'
          : 'incompleto',
        lastCheckIn: routeCheckIns[routeCheckIns.length - 1] || null,
      };
    });
  }
}