import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  private async resolveShiftCompany(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { guard: { select: { companyId: true } } },
    });
    return { shift, companyId: shift?.guard?.companyId ?? null };
  }

  async findAll(user: AuthUser, query: { date?: string; postId?: string; guardId?: string; status?: string }) {
    const where: any = { guard: { companyId: user.companyId, deletedAt: null } };
    if (query.date) where.date = new Date(query.date);
    if (query.postId) where.postId = query.postId;
    if (query.guardId) where.guardId = query.guardId;
    if (query.status) where.status = query.status;

    return this.prisma.shift.findMany({
      where,
      include: {
        guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        post: { include: { site: { select: { id: true, name: true } } } },
        service: true,
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });
  }

  async getEvents(user: AuthUser, from: string, to: string) {
    if (!from || !to) throw new BadRequestException('Parámetros from y to son requeridos');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) throw new BadRequestException('Fechas inválidas');
    if (fromDate > toDate) throw new BadRequestException('La fecha inicial no puede ser posterior a la final');
    toDate.setHours(23, 59, 59, 999);

    const shifts = await this.prisma.shift.findMany({
      where: {
        guard: { companyId: user.companyId ?? undefined, deletedAt: null },
        date: { gte: fromDate, lte: toDate },
      },
      include: {
        guard: { select: { id: true, firstName: true, lastName: true } },
        post: { include: { site: { select: { id: true, name: true } } } },
      },
      orderBy: { date: 'asc' },
    });

    return shifts.map((s) => ({
      id: s.id,
      title: `${s.guard.firstName} ${s.guard.lastName} — ${s.post.name}`,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      guard: s.guard,
      post: s.post,
    }));
  }

  async getCoverage(user: AuthUser, date: string) {
    if (!date) throw new BadRequestException('Parámetro date es requerido');
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) throw new BadRequestException('Fecha inválida');
    const shifts = await this.prisma.shift.findMany({
      where: {
        guard: { companyId: user.companyId ?? undefined },
        date: targetDate,
        status: { not: 'cancelado' },
      },
      include: {
        post: { include: { site: true } },
        guard: { select: { id: true, firstName: true, lastName: true } },
        attendances: true,
      },
    });

    const posts = await this.prisma.post.findMany({
      where: { site: { client: { companyId: user.companyId ?? undefined } }, active: true },
      include: { site: true },
    });

    const covered = new Set(shifts.map((s) => s.postId));
    return {
      date: targetDate.toISOString().slice(0, 10),
      totalPosts: posts.length,
      totalShifts: shifts.length,
      coveredPosts: covered.size,
      uncoveredPosts: posts.filter((p) => !covered.has(p.id)).map((p) => ({
        id: p.id,
        name: p.name,
        site: p.site.name,
        shiftStart: p.shiftStart,
        shiftEnd: p.shiftEnd,
      })),
      shifts,
    };
  }

  async findOne(user: AuthUser, id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        guard: true,
        post: { include: { site: true } },
        service: true,
        attendances: { orderBy: { timestamp: 'asc' } },
      },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');
    await this.assertAccess(user, shift.guard.companyId);
    return shift;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');

    const guard = await this.prisma.guard.findFirst({
      where: { id: body.guardId, companyId: user.companyId ?? undefined, deletedAt: null },
    });
    if (!guard) throw new NotFoundException('Guardia no encontrado');

    const post = await this.prisma.post.findUnique({
      where: { id: body.postId },
      include: { site: { include: { client: { select: { companyId: true } } } } },
    });
    if (!post) throw new NotFoundException('Puesto no encontrado');
    if (post.site.client.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    await this.validateNoConflict(body.guardId, body.date, body.startTime, body.endTime, null);

    const date = new Date(body.date + 'T00:00:00.000Z');
    return this.prisma.shift.create({
      data: {
        guardId: body.guardId,
        postId: body.postId,
        serviceId: body.serviceId || null,
        date,
        startTime: body.startTime,
        endTime: body.endTime,
        status: body.status || 'programado',
        notes: body.notes,
      },
      include: {
        guard: { select: { id: true, firstName: true, lastName: true } },
        post: { include: { site: true } },
      },
    });
  }

  private async validateNoConflict(guardId: string, date: string, startTime: string, endTime: string, excludeId: string | null) {
    const dateObj = new Date(date + 'T00:00:00.000Z');
    const conflicts = await this.prisma.shift.findMany({
      where: {
        guardId,
        date: dateObj,
        status: { not: 'cancelado' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    const startMinutes = this.toMinutes(startTime);
    const endMinutes = this.toMinutes(endTime);

    for (const c of conflicts) {
      const cStart = this.toMinutes(c.startTime);
      const cEnd = this.toMinutes(c.endTime);
      const overlaps = startMinutes < cEnd && endMinutes > cStart;
      if (overlaps) {
        throw new BadRequestException(
          `Conflicto: el guardia ya tiene un turno asignado (${c.startTime}-${c.endTime})`,
        );
      }
    }
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  async createBulk(user: AuthUser, shifts: any[]) {
    if (!Array.isArray(shifts) || shifts.length === 0) {
      throw new BadRequestException('Lista de turnos requerida');
    }
    const results: any[] = [];
    const errors: { index: number; message: string }[] = [];
    for (let i = 0; i < shifts.length; i++) {
      try {
        results.push(await this.create(user, shifts[i]));
      } catch (e) {
        errors.push({ index: i, message: (e as Error).message });
      }
    }
    return { created: results.length, errors };
  }

  async update(user: AuthUser, id: string, body: any) {
    const { shift, companyId } = await this.resolveShiftCompany(id);
    if (!shift) throw new NotFoundException('Turno no encontrado');
    await this.assertAccess(user, companyId);

    if ((body.startTime || body.endTime || body.date || body.guardId) && shift.status !== 'cancelado') {
      const startTime = body.startTime || shift.startTime;
      const endTime = body.endTime || shift.endTime;
      const date = body.date ? new Date(body.date + 'T00:00:00.000Z') : shift.date;
      const guardId = body.guardId || shift.guardId;
      const dateStr = date.toISOString().slice(0, 10);
      await this.validateNoConflict(guardId, dateStr, startTime, endTime, id);
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        ...(body.guardId && { guardId: body.guardId }),
        ...(body.postId && { postId: body.postId }),
        ...(body.serviceId !== undefined && { serviceId: body.serviceId || null }),
        ...(body.date && { date: new Date(body.date + 'T00:00:00.000Z') }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const { shift, companyId } = await this.resolveShiftCompany(id);
    if (!shift) throw new NotFoundException('Turno no encontrado');
    await this.assertAccess(user, companyId);
    return this.prisma.shift.update({ where: { id }, data: { status: 'cancelado' } });
  }
}