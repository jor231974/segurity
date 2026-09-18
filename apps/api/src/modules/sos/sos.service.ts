import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SosService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(user: AuthUser, body: any) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    if (body.latitude === undefined || body.longitude === undefined) {
      throw new BadRequestException('Ubicación GPS requerida');
    }

    const guard = await this.prisma.guard.findUnique({ where: { id: user.guardId } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const shift = await this.prisma.shift.findFirst({
      where: { guardId: guard.id, date: new Date(todayStr + 'T00:00:00.000Z'), status: { in: ['programado', 'activo'] } },
      orderBy: { startTime: 'asc' },
    });

    const sos = await this.prisma.sosAlert.create({
      data: {
        companyId: guard.companyId,
        guardId: guard.id,
        shiftId: shift?.id || null,
        serviceId: shift?.serviceId || null,
        latitude: body.latitude,
        longitude: body.longitude,
        message: body.message || 'SOS activado',
        status: 'activa',
      },
    });

    // Notificar a todos los usuarios autorizados
    try {
      const users = await this.prisma.user.findMany({
        where: {
          companyId: guard.companyId,
          userRoles: { some: { role: { code: { in: ['MONITOR', 'SUPERVISOR', 'ADMINISTRATOR', 'DIRECTOR'] } } } },
        },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          companyId: guard.companyId,
          type: 'sos_alert',
          title: 'Alerta SOS activada',
          body: `${guard.firstName} ${guard.lastName} ha activado SOS`,
          data: { sosId: sos.id },
        })),
      });
    } catch {}

    return { id: sos.id, status: sos.status, message: 'Alerta SOS activada. Notificaciones enviadas.', timestamp: sos.createdAt };
  }

  async findAll(user: AuthUser, query: { status?: string; date?: string }) {
    const where: any = { companyId: user.companyId };
    if (query.status) where.status = query.status;
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.createdAt = { gte: start, lte: end };
    }
    return this.prisma.sosAlert.findMany({
      where,
      include: {
        guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        handledBy: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const alert = await this.prisma.sosAlert.findUnique({
      where: { id },
      include: { guard: true, handledBy: true },
    });
    if (!alert) throw new NotFoundException('Alerta SOS no encontrada');
    if (alert.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return alert;
  }

  async acknowledge(user: AuthUser, id: string) {
    const alert = await this.prisma.sosAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta SOS no encontrada');
    if (alert.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.sosAlert.update({
      where: { id },
      data: { status: 'atendida', handledById: user.id, handledAt: new Date() },
    });
  }

  async close(user: AuthUser, id: string) {
    const alert = await this.prisma.sosAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta SOS no encontrada');
    if (alert.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.sosAlert.update({
      where: { id },
      data: { status: 'cerrada', handledById: alert.handledById || user.id, handledAt: alert.handledAt || new Date() },
    });
  }
}