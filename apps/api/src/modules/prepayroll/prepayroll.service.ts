import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { Decimal } from '@prisma/client/runtime/library';

const BASE_DAILY_WAGE = 400; // Salario base diario configurable (por operación)

@Injectable()
export class PrepayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    return this.prisma.prePayroll.findMany({
      where: { companyId: user.companyId ?? undefined },
      include: {
        generatedBy: { select: { name: true, lastName: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const pp = await this.prisma.prePayroll.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            guard: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
            service: true,
          },
        },
        generatedBy: { select: { name: true, lastName: true } },
      },
    });
    if (!pp) throw new NotFoundException('Pre-nómina no encontrada');
    if (pp.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return pp;
  }

  async generate(user: AuthUser, periodStart: string, periodEnd: string) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    const start = new Date(periodStart + 'T00:00:00.000Z');
    const end = new Date(periodEnd + 'T23:59:59.999Z');
    if (start >= end) throw new BadRequestException('Periodo inválido');

    // Verificar que no exista duplicado
    const dup = await this.prisma.prePayroll.findFirst({
      where: { companyId: user.companyId ?? undefined, periodStart: start, periodEnd: end },
    });
    if (dup) throw new BadRequestException('Ya existe una pre-nómina para ese periodo');

    // Recopilar todos los turnos del periodo
    const shifts = await this.prisma.shift.findMany({
      where: {
        guard: { companyId: user.companyId ?? undefined, deletedAt: null },
        date: { gte: start, lte: end },
        status: { not: 'cancelado' },
      },
      include: { guard: true, attendances: true },
    });

    if (shifts.length === 0) throw new BadRequestException('No hay turnos en el periodo');

    // Agrupar por guardia
    const byGuard = new Map<string, typeof shifts>();
    for (const s of shifts) {
      if (!byGuard.has(s.guardId)) byGuard.set(s.guardId, []);
      byGuard.get(s.guardId)!.push(s);
    }

    const pipe = await this.prisma.prePayroll.create({
      data: {
        companyId: user.companyId,
        periodStart: start,
        periodEnd: end,
        status: 'calculada',
        generatedById: user.id,
      },
    });

    const lines: any[] = [];
    for (const [guardId, guardShifts] of byGuard) {
      const workDays = new Set(guardShifts.map((s) => s.date.toISOString().slice(0, 10))).size;
      let workHours = 0;
      let overtimeHours = 0;
      let absences = 0;
      let lateMinutes = 0;

      for (const s of guardShifts) {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        let hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        if (hours < 0) hours += 24;
        workHours += hours;
        if (hours > 12) overtimeHours += hours - 12;

        const hasEntry = s.attendances.some((a) => a.type === 'entrada');
        const hasExit = s.attendances.some((a) => a.type === 'salida');
        if (!hasEntry || !hasExit) absences += 1;

        const late = s.attendances.filter((a) => a.type === 'entrada' && a.status === 'fuera_de_horario');
        if (late.length > 0) lateMinutes += 15;
      }

      const baseAmount = workDays * BASE_DAILY_WAGE;
      const overtimeAmount = overtimeHours * (BASE_DAILY_WAGE / 8) * 2;
      const bonusAmount = workDays === guardShifts.length ? 100 : 0;
      const discountAmount = absences * BASE_DAILY_WAGE;
      const totalAmount = baseAmount + overtimeAmount + bonusAmount - discountAmount;

      const line = await this.prisma.prePayrollLine.create({
        data: {
          prepayrollId: pipe.id,
          guardId,
          serviceId: guardShifts[0].serviceId || null,
          shiftId: guardShifts[0].id,
          workDays,
          workHours: Math.round(workHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          absences,
          lateMinutes,
          baseAmount: new Decimal(baseAmount),
          overtimeAmount: new Decimal(overtimeAmount),
          bonusAmount: new Decimal(bonusAmount),
          discountAmount: new Decimal(discountAmount),
          totalAmount: new Decimal(totalAmount),
        },
        include: { guard: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
      });
      lines.push(line);
    }

    const totalAmount = lines.reduce((sum, l) => sum + Number(l.totalAmount), 0);
    await this.prisma.prePayroll.update({
      where: { id: pipe.id },
      data: { totalAmount: new Decimal(totalAmount) },
    });

    return this.findOne(user, pipe.id);
  }

  async updateStatus(user: AuthUser, id: string, status: string) {
    const pp = await this.prisma.prePayroll.findUnique({ where: { id } });
    if (!pp) throw new NotFoundException('Pre-nómina no encontrada');
    if (pp.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    const valid = ['borrador', 'calculada', 'revisada', 'aprobada', 'exportada'];
    if (!valid.includes(status)) throw new BadRequestException('Estado inválido');
    return this.prisma.prePayroll.update({ where: { id }, data: { status } });
  }

  async remove(user: AuthUser, id: string) {
    const pp = await this.prisma.prePayroll.findUnique({ where: { id } });
    if (!pp) throw new NotFoundException('Pre-nómina no encontrada');
    if (pp.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    await this.prisma.prePayrollLine.deleteMany({ where: { prepayrollId: id } });
    return this.prisma.prePayroll.delete({ where: { id } });
  }

  async export(user: AuthUser, id: string) {
    const pp = await this.findOne(user, id);
    const sep = ';';
    let csv = 'Empleado;Nombre;Dias;Horas;HorasExtra;Faltas;Retardos;Base;Extra;Bonos;Descuentos;Total\n';
    for (const l of pp.lines) {
      csv += [
        l.guard.employeeNumber,
        `${l.guard.firstName} ${l.guard.lastName}`,
        l.workDays, l.workHours, l.overtimeHours, l.absences, l.lateMinutes,
        Number(l.baseAmount), Number(l.overtimeAmount), Number(l.bonusAmount), Number(l.discountAmount), Number(l.totalAmount),
      ].join(sep) + '\n';
    }
    return { filename: `prepayroll_${pp.periodStart.toISOString().slice(0,10)}_${pp.periodEnd.toISOString().slice(0,10)}.csv`, csv };
  }
}