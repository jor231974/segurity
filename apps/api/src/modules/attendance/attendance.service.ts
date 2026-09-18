import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { haversineDistanceKm, isInsideGeofence } from '../../common/utils/geo';
import { findCurrentShift, localDateStr, toMinutes } from '../../common/utils/shift';

/** Estados del guardia que impiden marcar asistencia. */
const BLOCKED_GUARD_STATUS = new Set(['baja', 'suspendido']);

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fecha local (YYYY-MM-DD) para evitar desfases por la frontera UTC al agendar turnos. */
  private localDateStr(d: Date): string {
    return localDateStr(d);
  }

  private startOfLocalDay(d: Date): Date {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
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

    // Incluir el turno nocturno del día anterior aún en curso (cruza medianoche).
    const current = await findCurrentShift(this.prisma, user.guardId, new Date());
    if (current && !shifts.some((s) => s.id === current.id)) {
      shifts.push(current as any);
    }

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
    if (BLOCKED_GUARD_STATUS.has(guard.status)) {
      throw new ForbiddenException(
        guard.status === 'baja'
          ? 'Tu perfil está dado de baja. No puedes marcar asistencia.'
          : 'Tu perfil está suspendido. Contacta a tu supervisor.',
      );
    }

    const type = body.type;
    if (!['entrada', 'salida'].includes(type)) throw new BadRequestException('Tipo inválido');
    if (body.latitude === undefined || body.longitude === undefined) {
      throw new BadRequestException('Ubicación GPS requerida');
    }

    const now = new Date();

    // Evitar doble entrada y salida sin entrada previa.
    const todayRecords = await this.prisma.attendance.findMany({
      where: {
        guardId: guard.id,
        timestamp: { gte: this.startOfLocalDay(now), lte: new Date() },
      },
      orderBy: { timestamp: 'asc' },
    });
    const lastRecord = todayRecords[todayRecords.length - 1];

    if (type === 'entrada') {
      if (lastRecord && lastRecord.type === 'entrada') {
        throw new BadRequestException('Ya registraste tu entrada hoy');
      }
    } else {
      if (lastRecord && lastRecord.type === 'salida') {
        throw new BadRequestException('Ya registraste tu salida hoy');
      }
      if (!todayRecords.some((r) => r.type === 'entrada')) {
        throw new BadRequestException('Primero debes registrar tu entrada');
      }
    }

    // Buscar el turno en curso (soporta rondín nocturno que cruza medianoche).
    const shift = await findCurrentShift(this.prisma, guard.id, now);

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
    const shiftStart = toMinutes(shift.startTime);
    const shiftEnd = toMinutes(shift.endTime);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (type === 'entrada' && nowMinutes > shiftStart + 15) status = 'fuera_de_horario';
    if (type === 'salida' && nowMinutes < shiftEnd - 30) status = 'salida_anticipada';
    if (geofenceResult === 'fuera') status = 'fuera_de_geocerca';

    const [record] = await this.prisma.$transaction([
      this.prisma.attendance.create({
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
      }),
      this.prisma.shift.update({
        where: { id: shift.id },
        data: { status: type === 'entrada' ? 'activo' : 'completado' },
      }),
    ]);

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
    return toMinutes(time);
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