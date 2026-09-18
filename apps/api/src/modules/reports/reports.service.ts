import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private range(from?: string, to?: string) {
    if (!from || !to) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { start, end };
    }
    const start = new Date(from + 'T00:00:00.000Z');
    const end = new Date(to + 'T23:59:59.999Z');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new BadRequestException('Fechas inválidas');
    if (start > end) throw new BadRequestException('Rango de fechas inválido');
    return { start, end };
  }

  async attendance(user: AuthUser, from?: string, to?: string, guardId?: string) {
    const { start, end } = this.range(from, to);
    const where: any = { guard: { companyId: user.companyId }, timestamp: { gte: start, lte: end } };
    if (guardId) where.guardId = guardId;
    const records = await this.prisma.attendance.findMany({
      where,
      include: { guard: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } }, shift: { include: { post: true } } },
      orderBy: { timestamp: 'asc' },
    });
    return {
      from, to,
      total: records.length,
      inside: records.filter((r) => r.geofenceResult === 'dentro').length,
      outside: records.filter((r) => r.geofenceResult === 'fuera').length,
      late: records.filter((r) => r.status === 'fuera_de_horario').length,
      early: records.filter((r) => r.status === 'salida_anticipada').length,
      records,
    };
  }

  async shifts(user: AuthUser, from?: string, to?: string) {
    const { start, end } = this.range(from, to);
    const shifts = await this.prisma.shift.findMany({
      where: { guard: { companyId: user.companyId ?? undefined }, date: { gte: start, lte: end }, status: { not: 'cancelado' } },
      include: { guard: { select: { id: true, firstName: true, lastName: true } }, post: { include: { site: true } } },
      orderBy: { date: 'asc' },
    });
    const byStatus: Record<string, number> = {};
    for (const s of shifts) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    return { total: shifts.length, byStatus, shifts };
  }

  async patrols(user: AuthUser, from?: string, to?: string) {
    const { start, end } = this.range(from, to);
    const checkIns = await this.prisma.patrolCheckIn.findMany({
      where: { guard: { companyId: user.companyId ?? undefined }, timestamp: { gte: start, lte: end } },
      include: { checkpoint: { include: { route: true } }, guard: { select: { firstName: true, lastName: true } } },
      orderBy: { timestamp: 'asc' },
    });
    const byRoute: Record<string, number> = {};
    for (const c of checkIns) byRoute[c.checkpoint.route.name] = (byRoute[c.checkpoint.route.name] || 0) + 1;
    return { total: checkIns.length, byRoute, checkIns };
  }

  async incidents(user: AuthUser, from?: string, to?: string, status?: string) {
    const { start, end } = this.range(from, to);
    const where: any = { companyId: user.companyId, createdAt: { gte: start, lte: end } };
    if (status) where.status = status;
    const incidents = await this.prisma.incident.findMany({
      where,
      include: { type: true, reporter: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const bySeverity: Record<string, number> = {};
    for (const i of incidents) bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    return { total: incidents.length, bySeverity, incidents };
  }

  async logbook(user: AuthUser, from?: string, to?: string) {
    const { start, end } = this.range(from, to);
    const entries = await this.prisma.logbookEntry.findMany({
      where: { guard: { companyId: user.companyId ?? undefined }, createdAt: { gte: start, lte: end } },
      include: { guard: { select: { firstName: true, lastName: true } }, post: { include: { site: true } }, files: true },
      orderBy: { createdAt: 'desc' },
    });
    return { total: entries.length, entries };
  }

  async billing(user: AuthUser, from?: string, to?: string) {
    const { start, end } = this.range(from, to);
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId: user.companyId ?? undefined, periodStart: { gte: start, lte: end } },
      include: { contract: { include: { client: true } }, payments: true },
    });
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
    return { totalInvoices: invoices.length, totalInvoiced, totalPaid, outstanding: totalInvoiced - totalPaid, invoices };
  }

  async profitability(user: AuthUser) {
    const services = await this.prisma.contractService.findMany({
      where: { contract: { companyId: user.companyId ?? undefined, status: 'activo', deletedAt: null } },
      include: { contract: { include: { client: { select: { id: true, commercialName: true } } } } },
    });

    const byClient = new Map<string, { client: string; income: number; cost: number }>();
    for (const s of services) {
      const key = s.contract.client.id;
      const entry = byClient.get(key) || { client: s.contract.client.commercialName, income: 0, cost: 0 };
      entry.income += Number(s.tariff);
      entry.cost += Number(s.estimatedCost || 0);
      byClient.set(key, entry);
    }

    const byClientArr = Array.from(byClient.values()).map((c) => ({
      client: c.client,
      income: c.income,
      cost: c.cost,
      margin: c.income > 0 ? ((c.income - c.cost) / c.income) * 100 : 0,
    }));

    const totalIncome = byClientArr.reduce((s, c) => s + c.income, 0);
    const totalCost = byClientArr.reduce((s, c) => s + c.cost, 0);

    return {
      totalIncome,
      totalCost,
      totalMargin: totalIncome > 0 ? ((totalIncome - totalCost) / totalIncome) * 100 : 0,
      byClient: byClientArr,
    };
  }

  async audit(user: AuthUser, from?: string, to?: string, module?: string) {
    const { start, end } = this.range(from, to);
    const where: any = { companyId: user.companyId, createdAt: { gte: start, lte: end } };
    if (module) where.module = module;
    return this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });
  }

  async generate(user: AuthUser, body: { name: string; type: string; from: string; to: string }) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    return this.prisma.report.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        type: body.type,
        filters: { from: body.from, to: body.to } as any,
        generatedById: user.id,
      },
    });
  }
}