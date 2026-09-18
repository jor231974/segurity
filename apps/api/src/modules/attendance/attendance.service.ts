import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { haversineDistanceKm, isInsideGeofence } from '../../common/utils/geo';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fecha local (YYYY-MM-DD) para evitar desfases por la frontera UTC al agendar turnos. */
  private localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async findAll(user: AuthUser, query: { date?: string; guardId?: string; shiftId?: string }) {
    const where: any = {};
    if (user.companyId) where.guard = { companyId: user.companyId };
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.timestamp = { gte: start, lte: end };
    }
    if (query.guardId) where.guardId = query.guardId;
    if (query.shiftId) where.shiftId = query.shiftId;

    return this.prisma.attendance.findMany({
      where,
      include: {
        guard: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        shift: { include: { post: { include: { site: true } } } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async myToday(user: AuthUser) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const records = await this.prisma.attendance.findMany({
      where: { guardId: user.guardId, timestamp: { gte: start, lte: end } },
      include: { shift: { include: { post: { include: { site: true } } } }, post: true },
      orderBy: { timestamp: 'asc' },
    });

    const shifts = await this.prisma.shift.findMany({
      where: {
        guardId: user.guardId,
        date: new Date(this.localDateStr(start) + 'T00:00:00.000Z'),
        status: { in: ['programado', 'activo'] },
      },
      include: { post: { include: { site: true } } },
      orderBy: { startTime: 'asc' },
    });

    return { records, shifts };
  }

  async summary(user: AuthUser, date: string) {
    const target = date
      ? new Date(date + 'T00:00:00.000Z')
      : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const next = new Date(target);
    next.setDate(next.getDate() + 1);

    const where: any = {
      timestamp: { gte: target, lt: next },
      guard: { companyId: user.companyId },
    };

    const [records, guards, shifts] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: { guard: true, shift: { include: { post: true } } },
      }),
      this.prisma.guard.findMany({
        where: { companyId: user.companyId ?? undefined, deletedAt: null, status: 'activo' },
      }),
      this.prisma.shift.findMany({
        where: { date: target, guard: { companyId: user.companyId ?? undefined }, status: { not: 'cancelado' } },
        include: { guard: true, post: true },
      }),
    ]);

    const checkedIn = new Set(
      records.filter((r) => r.type === 'entrada').map((r) => r.guardId),
    );

    return {
      date: target.toISOString().slice(0, 10),
      totalGuards: guards.length,
      checkedIn: checkedIn.size,
      absentees: guards.filter((g) => !checkedIn.has(g.id) && shifts.some((s) => s.guardId === g.id)),
      lateRecords: records.filter((r) => r.status === 'fuera_de_horario'),
      outsideRecords: records.filter((r) => r.status === 'fuera_de_geocerca'),
      totalRecords: records.length,
      shifts: shifts.length,
    };
  }

  async findOne(user: AuthUser, id: string) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: { guard: true, shift: { include: { post: { include: { site: true } } } } },
    });
    if (!record) throw new NotFoundException('Registro no encontrado');
    return record;
  }

  async check(user: AuthUser, body: any) {
    const guard = user.guardId
      ? await this.prisma.guard.findUnique({ where: { id: user.guardId } })
      : null;
    if (!guard) throw new ForbiddenException('El usuario no es guardia');

    const type = body.type;
    if (!['entrada', 'salida'].includes(type)) throw new BadRequestException('Tipo inválido');
    if (body.latitude === undefined || body.longitude === undefined) {
      throw new BadRequestException('Ubicación GPS requerida');
    }

    const now = new Date();
    const todayStr = this.localDateStr(now);

    // Buscar turno activo del día
    const shift = await this.prisma.shift.findFirst({
      where: {
        guardId: guard.id,
        date: new Date(todayStr + 'T00:00:00.000Z'),
        status: { in: ['programado', 'activo'] },
      },
      include: { post: { include: { site: true } } },
      orderBy: { startTime: 'asc' },
    });

    if (!shift) {
      throw new BadRequestException('No tiene turno programado para hoy');
    }

    const site = shift.post.site;
    let distanceFromSite: number | null = null;
    let geofenceResult = 'dentro';

    if (site.latitude && site.longitude) {
      distanceFromSite = haversineDistanceKm(body.latitude, body.longitude, site.latitude, site.longitude) * 1000;
      geofenceResult = isInsideGeofence(
        body.latitude,
        body.longitude,
        site.latitude,
        site.longitude,
        site.geofenceRadiusMeters,
      ) ? 'dentro' : 'fuera';
    }

    // Evaluar desviaciones
    let status: string | null = 'ok';
    const shiftStart = this.toMinutes(shift.startTime);
    const shiftEnd = this.toMinutes(shift.endTime);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (type === 'entrada' && nowMinutes > shiftStart + 15) status = 'fuera_de_horario';
    if (type === 'salida' && nowMinutes < shiftEnd - 30) status = 'salida_anticipada';
    if (geofenceResult === 'fuera') status = 'fuera_de_geocerca';

    const record = await this.prisma.attendance.create({
      data: {
        guardId: guard.id,
        shiftId: shift.id,
        postId: shift.postId,
        serviceId: shift.serviceId,
        type,
        timestamp: new Date(),
        latitude: body.latitude,
        longitude: body.longitude,
        device: body.device,
        distanceFromSite,
        geofenceResult,
        status,
        synced: false,
      },
      include: { shift: { include: { post: { include: { site: true } } } } },
    });

    return {
      id: record.id,
      type: record.type,
      timestamp: record.timestamp,
      status: record.status,
      geofenceResult,
      distanceFromSite: distanceFromSite ? Math.round(distanceFromSite) : null,
      site: { id: site.id, name: site.name, latitude: site.latitude, longitude: site.longitude, radiusMeters: site.geofenceRadiusMeters },
      shift: {
        id: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        post: shift.post.name,
      },
    };
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  async sync(user: AuthUser, records: any[]) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (!Array.isArray(records) || records.length === 0) {
      return { synced: 0 };
    }
    const results: string[] = [];
    const errors: { timestamp?: any; message: string }[] = [];

    for (const rec of records) {
      try {
        // Detectar duplicados por (guardId, tipo, fecha aproximada)
        if (!rec.type || rec.timestamp === undefined) {
          throw new BadRequestException('Registro incompleto');
        }
        const timestamp = new Date(rec.timestamp);
        const near = new Date(timestamp.getTime() + 60000);
        const prev = await this.prisma.attendance.findFirst({
          where: {
            guardId: user.guardId,
            type: rec.type,
            timestamp: { gte: new Date(timestamp.getTime() - 60000), lte: near },
          },
        });
        if (prev) {
          errors.push({ timestamp: rec.timestamp, message: 'Ya existe un registro similar' });
          continue;
        }
        const created = await this.prisma.attendance.create({
          data: {
            guardId: user.guardId,
            type: rec.type,
            timestamp,
            latitude: rec.latitude,
            longitude: rec.longitude,
            device: rec.device || 'offline-sync',
            status: rec.status,
            geofenceResult: rec.geofenceResult,
            synced: true,
          },
        });
        results.push(created.id);
      } catch (e) {
        errors.push({ timestamp: rec.timestamp, message: (e as Error).message });
      }
    }
    return { synced: results.length, errors };
  }
}