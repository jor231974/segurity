import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fecha local (YYYY-MM-DD) para evitar desfases por la frontera UTC al cruzar turnos/asistencia. */
  private localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async getOverview(user: AuthUser) {
    if (!user.companyId) return { message: 'Sin empresa asociada' };
    const today = new Date();
    const todayStr = this.localDateStr(today);
    const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
    const endOfDay = new Date(todayStr + 'T23:59:59.999Z');

    const [
      guards,
      activeShifts,
      attendanceToday,
      openIncidents,
      openSos,
      clients,
      services,
      expiringDocuments,
      unpaidInvoices,
    ] = await Promise.all([
      this.prisma.guard.count({ where: { companyId: user.companyId, deletedAt: null, status: { not: 'baja' } } }),
      this.prisma.shift.findMany({
        where: {
          guard: { companyId: user.companyId },
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['programado', 'activo'] },
        },
        include: { guard: true, post: { include: { site: true } } },
      }),
      this.prisma.attendance.findMany({
        where: { timestamp: { gte: startOfDay, lte: endOfDay }, guard: { companyId: user.companyId } },
      }),
      this.prisma.incident.count({ where: { companyId: user.companyId, status: { in: ['abierta', 'atendida', 'en_investigacion'] } } }),
      this.prisma.sosAlert.count({ where: { companyId: user.companyId, status: { in: ['activa', 'atendida'] } } }),
      this.prisma.client.count({ where: { companyId: user.companyId, status: 'activo', deletedAt: null } }),
      this.prisma.contractService.count({ where: { contract: { companyId: user.companyId, status: 'activo', deletedAt: null } } }),
      this.prisma.guardDocument.count({
        where: {
          guard: { companyId: user.companyId },
          expirationDate: { not: null, lte: new Date(Date.now() + 30 * 86400000), gte: new Date() },
        },
      }),
      this.prisma.invoice.findMany({
        where: { companyId: user.companyId, status: { in: ['pendiente', 'parcialmente_pagada', 'vencida'] } },
      }),
    ]);

    const checkedInGuardIds = new Set(attendanceToday.filter((a) => a.type === 'entrada').map((a) => a.guardId));
    const coveredPosts = new Set(activeShifts.map((s) => s.postId));
    const dueOutstanding = unpaidInvoices.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0);

    return {
      date: todayStr,
      guards: {
        total: guards,
        assignedToday: activeShifts.length,
        checkedIn: checkedInGuardIds.size,
      },
      coverage: {
        coveredPosts: coveredPosts.size,
        totalShifts: activeShifts.length,
        uncoveredPosts: activeShifts.length - coveredPosts.size,
      },
      incidents: { open: openIncidents },
      sos: { active: openSos },
      clients: { total: clients },
      services: { total: services },
      alerts: { expiringDocuments, overdueInvoices: unpaidInvoices.length, outstandingAmount: dueOutstanding },
      activeShifts,
    };
  }

  async getGuardHub(user: AuthUser) {
    if (!user.guardId) return { message: 'El usuario no es guardia' };
    const now = new Date();
    const todayStr = this.localDateStr(now);

    const [guard, shift] = await Promise.all([
      this.prisma.guard.findUnique({
        where: { id: user.guardId },
        include: { zone: true, supervisor: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      }),
      this.prisma.shift.findFirst({
        where: { guardId: user.guardId, date: new Date(todayStr + 'T00:00:00.000Z'), status: { in: ['programado', 'activo'] } },
        include: { post: { include: { site: true, consigns: { where: { status: 'activo' } } } } },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const [attendance, consigns] = shift ? await Promise.all([
      this.prisma.attendance.findMany({
        where: { guardId: user.guardId, shiftId: shift.id },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.consign.findMany({
        where: { postId: shift.postId, status: 'activo' },
        include: { acks: { where: { guardId: user.guardId } } },
      }),
    ]) : [[], []];

    return {
      guard,
      currentShift: shift ? {
        id: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        post: shift.post,
        site: shift.post.site,
        attendance,
        consigns: consigns.map((c) => ({ ...c, acked: c.acks.length > 0 })),
      } : null,
    };
  }
}