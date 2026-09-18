import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ClientRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { status?: string; clientId?: string }) {
    const where: any = { companyId: user.companyId };
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;
    return this.prisma.clientRequest.findMany({
      where,
      include: {
        client: { select: { id: true, commercialName: true } },
        requestedBy: { select: { id: true, name: true, lastName: true } },
        assignedTo: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMine(user: AuthUser) {
    const clientLink = await this.prisma.clientUser.findUnique({ where: { userId: user.id } });
    if (!clientLink) throw new ForbiddenException('El usuario no está vinculado a un cliente');
    return this.prisma.clientRequest.findMany({
      where: { clientId: clientLink.clientId },
      include: { assignedTo: { select: { id: true, name: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const req = await this.prisma.clientRequest.findUnique({
      where: { id },
      include: { client: true, requestedBy: true, assignedTo: true },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');
    if (req.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      // Permitir que el cliente vinculado vea sus solicitudes
      const clientLink = await this.prisma.clientUser.findUnique({ where: { userId: user.id } });
      if (!clientLink || clientLink.clientId !== req.clientId) throw new ForbiddenException('Acceso denegado');
    }
    return req;
  }

  async create(user: AuthUser, body: any) {
    const clientLink = await this.prisma.clientUser.findUnique({ where: { userId: user.id } });
    if (!clientLink) throw new ForbiddenException('El usuario no está vinculado a un cliente');
    if (!body.description || !body.type) throw new BadRequestException('Tipo y descripción requeridos');
    const client = await this.prisma.client.findUnique({ where: { id: clientLink.clientId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    return this.prisma.clientRequest.create({
      data: {
        companyId: client.companyId,
        clientId: clientLink.clientId,
        requestedById: user.id,
        type: body.type,
        priority: body.priority || 'media',
        description: body.description,
        status: 'abierta',
      },
    });
  }

  async respond(user: AuthUser, id: string, body: any) {
    const req = await this.prisma.clientRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Solicitud no encontrada');
    if (req.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    const status = ['abierta', 'en_proceso', 'resuelta', 'cerrada'].includes(body.status) ? body.status : 'en_proceso';
    return this.prisma.clientRequest.update({
      where: { id },
      data: {
        status,
        response: body.response,
        assignedToId: body.assignedToId || user.id,
        completedAt: status === 'resuelta' || status === 'cerrada' ? new Date() : null,
      },
    });
  }
}