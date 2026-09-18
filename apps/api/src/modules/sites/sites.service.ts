import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  private async resolveSiteCompany(siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { client: { select: { companyId: true } } },
    });
    return { site, companyId: site?.client?.companyId ?? null };
  }

  private static validateCoordinates(body: any) {
    if (body.latitude !== undefined && body.latitude !== null && body.latitude !== '') {
      const lat = Number(body.latitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        throw new BadRequestException('Latitud inválida (debe estar entre -90 y 90)');
      }
    }
    if (body.longitude !== undefined && body.longitude !== null && body.longitude !== '') {
      const lng = Number(body.longitude);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        throw new BadRequestException('Longitud inválida (debe estar entre -180 y 180)');
      }
    }
    if (body.geofenceRadiusMeters !== undefined && body.geofenceRadiusMeters !== null && body.geofenceRadiusMeters !== '') {
      const radius = Number(body.geofenceRadiusMeters);
      if (Number.isNaN(radius) || radius < 10 || radius > 5000) {
        throw new BadRequestException('Radio de geocerca inválido (10–5000 m)');
      }
    }
  }

  async findAll(user: AuthUser) {
    const sites = await this.prisma.site.findMany({
      where: { client: { companyId: user.companyId ?? undefined }, deletedAt: null },
      include: {
        client: { select: { id: true, commercialName: true } },
        posts: { where: { active: true } },
      },
      orderBy: { name: 'asc' },
    });
    return sites;
  }

  async findForMap(user: AuthUser) {
    const sites = await this.prisma.site.findMany({
      where: { client: { companyId: user.companyId ?? undefined }, deletedAt: null, latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        geofenceRadiusMeters: true,
        client: { select: { id: true, commercialName: true } },
        posts: { where: { active: true }, select: { id: true, name: true } },
      },
    });
    return sites;
  }

  async findOne(user: AuthUser, id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        client: true,
        posts: { include: { consigns: { where: { status: 'activo' } } } },
        patrolRoutes: { include: { checkpoints: { orderBy: { sequence: 'asc' } } } },
      },
    });
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, site.client.companyId);
    return site;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    if (!body.clientId || !body.name?.trim()) {
      throw new BadRequestException('clientId y name son obligatorios');
    }

    const client = await this.prisma.client.findFirst({
      where: { id: body.clientId, companyId: user.companyId ?? undefined, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    SitesService.validateCoordinates(body);

    return this.prisma.site.create({
      data: {
        clientId: body.clientId,
        name: body.name,
        address: body.address,
        latitude: body.latitude === '' ? null : body.latitude,
        longitude: body.longitude === '' ? null : body.longitude,
        geofenceRadiusMeters: body.geofenceRadiusMeters === '' || body.geofenceRadiusMeters === undefined ? 100 : Number(body.geofenceRadiusMeters),
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        schedule: body.schedule,
        instructions: body.instructions,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const { site, companyId } = await this.resolveSiteCompany(id);
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, companyId);

    if (body.latitude !== undefined || body.longitude !== undefined || body.geofenceRadiusMeters !== undefined) {
      SitesService.validateCoordinates(body);
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.address && { address: body.address }),
        ...(body.latitude !== undefined && { latitude: body.latitude === '' ? null : Number(body.latitude) }),
        ...(body.longitude !== undefined && { longitude: body.longitude === '' ? null : Number(body.longitude) }),
        ...(body.geofenceRadiusMeters !== undefined && { geofenceRadiusMeters: body.geofenceRadiusMeters === '' ? 100 : Number(body.geofenceRadiusMeters) }),
        ...(body.contactName !== undefined && { contactName: body.contactName }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.schedule !== undefined && { schedule: body.schedule }),
        ...(body.instructions !== undefined && { instructions: body.instructions }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const { site, companyId } = await this.resolveSiteCompany(id);
    if (!site) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, companyId);
    return this.prisma.site.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPosts(user: AuthUser, id: string) {
    const { site, companyId } = await this.resolveSiteCompany(id);
    if (!site) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, companyId);
    return this.prisma.post.findMany({
      where: { siteId: id, active: true },
      include: { consigns: { where: { status: 'activo' } } },
      orderBy: { name: 'asc' },
    });
  }
}