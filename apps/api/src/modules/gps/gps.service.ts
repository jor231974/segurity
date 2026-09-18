import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { haversineDistanceKm } from '../../common/utils/geo';
import { findCurrentShift } from '../../common/utils/shift';

@Injectable()
export class GpsService {
  constructor(private readonly prisma: PrismaService) {}

  async ping(user: AuthUser, body: { latitude: number; longitude: number; accuracy?: number; device?: string }) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (body.latitude === undefined || body.longitude === undefined) {
      throw new BadRequestException('Coordenadas requeridas');
    }

    // Registrar con intervalo mínimo de 30s para no saturar el servidor
    const lastLog = await this.prisma.gpsLog.findFirst({
      where: { guardId: user.guardId },
      orderBy: { timestamp: 'desc' },
    });

    if (lastLog && Date.now() - lastLog.timestamp.getTime() < 30000) {
      return { skipped: true, message: 'Intervalo mínimo no transcurrido' };
    }

    const log = await this.prisma.gpsLog.create({
      data: {
        guardId: user.guardId,
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.accuracy,
        device: body.device,
      },
    });

    // Evaluar geocerca del puesto actual
    const shift = await findCurrentShift(this.prisma, user.guardId, new Date());

    let geofenceStatus: string | null = null;
    if (shift?.post?.site?.latitude && shift.post.site.longitude) {
      const distanceM = haversineDistanceKm(
        body.latitude,
        body.longitude,
        shift.post.site.latitude,
        shift.post.site.longitude,
      ) * 1000;
      geofenceStatus = distanceM <= shift.post.site.geofenceRadiusMeters ? 'dentro' : 'fuera';
    }

    return { id: log.id, timestamp: log.timestamp, geofenceStatus, skipped: false };
  }

  async positions(user: AuthUser) {
    const guards = await this.prisma.guard.findMany({
      where: { companyId: user.companyId ?? undefined, deletedAt: null, status: { in: ['activo', 'asignado'] } },
      include: {
        gpsLogs: { orderBy: { timestamp: 'desc' }, take: 1 },
        shifts: {
          where: { status: { in: ['programado', 'activo'] } },
          include: { post: { include: { site: true } } },
          take: 5,
        },
      },
    });

    return guards.map((g) => ({
      guard: { id: g.id, firstName: g.firstName, lastName: g.lastName, photoUrl: g.photoUrl, phone: g.phone },
      lastPosition: g.gpsLogs[0] || null,
      shift: g.shifts[0] || null,
    }));
  }

  async history(user: AuthUser, guardId: string, from: string, to: string) {
    const guard = await this.prisma.guard.findFirst({
      where: { id: guardId, companyId: user.companyId ?? undefined },
    });
    if (!guard) throw new NotFoundException('Guardia no encontrado');

    const where: any = { guardId };
    if (from) where.timestamp = { ...(where.timestamp || {}), gte: new Date(from) };
    if (to) where.timestamp = { ...(where.timestamp || {}), lte: new Date(to) };

    return this.prisma.gpsLog.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: 500,
    });
  }
}