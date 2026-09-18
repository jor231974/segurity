import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SupervisionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { date?: string; guardId?: string }) {
    const where: any = { companyId: user.companyId };
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.createdAt = { gte: start, lte: end };
    }
    if (query.guardId) where.guardId = query.guardId;

    return this.prisma.supervisionVisit.findMany({
      where,
      include: {
        supervisor: { select: { id: true, name: true, lastName: true } },
        guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        post: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const visit = await this.prisma.supervisionVisit.findUnique({
      where: { id },
      include: { supervisor: true, guard: true, post: { include: { site: true } } },
    });
    if (!visit) throw new NotFoundException('Visita no encontrada');
    if (visit.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return visit;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');

    const guard = await this.prisma.guard.findFirst({
      where: { id: body.guardId, companyId: user.companyId, deletedAt: null },
    });
    if (!guard) throw new NotFoundException('Guardia no encontrado');

    const checklist = body.checklist || {
      uniforme: false,
      equipo: false,
      presentacion: false,
      consignas: false,
      asistencia: false,
      puesto: false,
    };

    return this.prisma.supervisionVisit.create({
      data: {
        companyId: user.companyId,
        supervisorId: user.id,
        guardId: body.guardId,
        postId: body.postId || null,
        checklist: checklist as any,
        observations: body.observations,
        latitude: body.latitude,
        longitude: body.longitude,
        photoUrl: body.photoUrl,
      },
      include: { guard: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const visit = await this.prisma.supervisionVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visita no encontrada');
    if (visit.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    return this.prisma.supervisionVisit.update({
      where: { id },
      data: {
        ...(body.checklist && { checklist: body.checklist as any }),
        ...(body.observations !== undefined && { observations: body.observations }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
      },
    });
  }
}