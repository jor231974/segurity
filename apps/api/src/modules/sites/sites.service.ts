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

    return this.prisma.site.create({
      data: {
        clientId: body.clientId,
        name: body.name,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        geofenceRadiusMeters: body.geofenceRadiusMeters ?? 100,
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

    return this.prisma.site.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.address && { address: body.address }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.geofenceRadiusMeters && { geofenceRadiusMeters: body.geofenceRadiusMeters }),
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
      where: { siteId: id },
      include: { consigns: { where: { status: 'activo' } } },
      orderBy: { name: 'asc' },
    });
  }
}