import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class VisitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { siteId?: string; date?: string; inside?: string }) {
    const where: any = { site: { client: { companyId: user.companyId } } };
    if (query.siteId) where.siteId = query.siteId;
    if (query.inside === 'true') where.exitAt = null;
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.entryAt = { gte: start, lte: end };
    }
    return this.prisma.visitor.findMany({
      where,
      include: { site: { select: { id: true, name: true } }, guard: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { entryAt: 'desc' },
    });
  }

  async getInside(user: AuthUser, siteId?: string) {
    const where: any = { exitAt: null, site: { client: { companyId: user.companyId } } };
    if (siteId) where.siteId = siteId;
    return this.prisma.visitor.findMany({
      where,
      include: { site: { select: { id: true, name: true } } },
      orderBy: { entryAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const v = await this.prisma.visitor.findUnique({ where: { id }, include: { site: true, guard: true } });
    if (!v) throw new NotFoundException('Visitante no encontrado');
    return v;
  }

  async create(user: AuthUser, body: any) {
    if (!body.siteId || !body.fullName) throw new BadRequestException('siteId y fullName requeridos');
    const site = await this.prisma.site.findUnique({ where: { id: body.siteId }, include: { client: { select: { companyId: true } } } });
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    if (site.client.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.visitor.create({
      data: {
        siteId: body.siteId,
        fullName: body.fullName,
        identification: body.identification,
        companyName: body.companyName,
        personVisited: body.personVisited || 'No especificado',
        vehiclePlate: body.vehiclePlate,
        photoUrl: body.photoUrl,
        notes: body.notes,
        registeredById: user.id,
        guardId: user.guardId || null,
      },
    });
  }

  async registerExit(user: AuthUser, id: string) {
    const v = await this.prisma.visitor.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Visitante no encontrado');
    if (v.exitAt) throw new BadRequestException('El visitante ya registró salida');
    return this.prisma.visitor.update({ where: { id }, data: { exitAt: new Date() } });
  }
}