import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser, query: { page: string; limit: string; search?: string; status?: string }) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const where: any = { companyId: user.companyId, deletedAt: null };

    if (query.search?.trim()) {
      where.OR = [
        { legalName: { contains: query.search.trim(), mode: 'insensitive' } },
        { commercialName: { contains: query.search.trim(), mode: 'insensitive' } },
        { rfc: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;

    const [total, items] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        include: {
          contracts: { where: { status: 'activo' }, include: { services: true } },
          _count: { select: { sites: true, contracts: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page, limit, items };
  }

  async findOne(user: AuthUser, id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        contracts: { include: { services: true } },
        sites: true,
        clientUsers: { include: { user: { select: { id: true, name: true, lastName: true, email: true } } } },
      },
    });
    if (!client || client.deletedAt) throw new NotFoundException('Cliente no encontrado');
    await this.assertAccess(user, client.companyId);
    return client;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    if (!body.legalName?.trim() || !body.commercialName?.trim()) {
      throw new BadRequestException('legalName y commercialName son obligatorios');
    }
    const rfcExists = body.rfc
      ? await this.prisma.client.findFirst({
          where: { companyId: user.companyId, rfc: body.rfc, deletedAt: null },
        })
      : null;
    if (rfcExists) throw new BadRequestException('Ya existe un cliente con ese RFC');

    return this.prisma.client.create({
      data: {
        companyId: user.companyId,
        legalName: body.legalName,
        commercialName: body.commercialName,
        rfc: body.rfc,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxData: body.taxData,
        commercialTerms: body.commercialTerms,
        notes: body.notes,
        status: body.status || 'activo',
        contacts: body.contacts?.length
          ? { create: body.contacts }
          : undefined,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client || client.deletedAt) throw new NotFoundException('Cliente no encontrado');
    await this.assertAccess(user, client.companyId);

    return this.prisma.client.update({
      where: { id },
      data: {
        ...(body.legalName && { legalName: body.legalName }),
        ...(body.commercialName && { commercialName: body.commercialName }),
        ...(body.rfc !== undefined && { rfc: body.rfc }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address && { address: body.address }),
        ...(body.taxData !== undefined && { taxData: body.taxData }),
        ...(body.commercialTerms !== undefined && { commercialTerms: body.commercialTerms }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status && { status: body.status }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client || client.deletedAt) throw new NotFoundException('Cliente no encontrado');
    await this.assertAccess(user, client.companyId);
    return this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getMine(user: AuthUser) {
    const link = await this.prisma.clientUser.findUnique({ where: { userId: user.id } });
    if (!link) throw new ForbiddenException('Usuario no vinculado a un cliente');
    const client = await this.prisma.client.findUnique({
      where: { id: link.clientId },
      include: {
        contracts: { where: { deletedAt: null }, include: { services: true }, orderBy: { createdAt: 'desc' } },
        sites: { where: { deletedAt: null }, include: { posts: true }, orderBy: { name: 'asc' } },
        contacts: true,
        _count: { select: { contracts: true, sites: true, requests: true } },
      },
    });
    if (!client || client.deletedAt) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async getContracts(user: AuthUser, id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    await this.assertAccess(user, client.companyId);
    return this.prisma.contract.findMany({
      where: { clientId: id },
      include: { services: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSites(user: AuthUser, id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    await this.assertAccess(user, client.companyId);
    return this.prisma.site.findMany({
      where: { clientId: id, deletedAt: null },
      include: { posts: true },
      orderBy: { name: 'asc' },
    });
  }

  async addContact(user: AuthUser, id: string, body: any) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    await this.assertAccess(user, client.companyId);
    if (!body.name) throw new BadRequestException('Nombre del contacto requerido');
    return this.prisma.clientContact.create({
      data: {
        clientId: id,
        name: body.name,
        position: body.position,
        phone: body.phone,
        email: body.email,
        isPrimary: body.isPrimary ?? false,
      },
    });
  }
}