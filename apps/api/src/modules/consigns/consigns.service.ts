import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ConsignsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveConsignCompany(consignId: string) {
    const consign = await this.prisma.consign.findUnique({
      where: { id: consignId },
      include: { post: { include: { site: { include: { client: { select: { companyId: true } } } } } } },
    });
    return { consign, companyId: consign?.post?.site?.client?.companyId ?? null };
  }

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser, postId?: string, guardId?: string) {
    const where: any = {
      post: { site: { client: { companyId: user.companyId } } },
      status: 'activo',
    };
    if (postId) where.postId = postId;
    if (guardId) {
      const guard = await this.prisma.guard.findFirst({
        where: { id: guardId, companyId: user.companyId ?? undefined },
include: { shifts: { where: { status: { in: ['activo', 'programado'] } } } },
      });
      const postIds = guard?.shifts.map((s) => s.postId) || [];
      where.postId = { in: postIds };
    }

    return this.prisma.consign.findMany({
      where,
      include: {
        post: { include: { site: { select: { name: true } } } },
        author: { select: { name: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMyConsigns(user: AuthUser) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    const guard = await this.prisma.guard.findUnique({
      where: { id: user.guardId },
      include: { shifts: { where: { status: { in: ['activo', 'programado'] } } } },
    });
    if (!guard) throw new NotFoundException('Guardia no encontrado');

    const postIds = guard.shifts.map((s) => s.postId);
    const consigns = await this.prisma.consign.findMany({
      where: { postId: { in: postIds }, status: 'activo' },
      include: {
        post: { select: { id: true, name: true } },
        acks: { where: { guardId: user.guardId } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return consigns.map((c) => ({ ...c, acked: c.acks.length > 0 }));
  }

  async findOne(user: AuthUser, id: string) {
    const consign = await this.prisma.consign.findUnique({
      where: { id },
      include: {
        post: { include: { site: { include: { client: { select: { companyId: true } } } } } },
        author: { select: { name: true, lastName: true } },
        history: { orderBy: { changedAt: 'desc' } },
      },
    });
    if (!consign) throw new NotFoundException('Consigna no encontrada');
    await this.assertAccess(user, consign.post.site.client.companyId);
    return consign;
  }

  async create(user: AuthUser, body: any) {
    const post = await this.prisma.post.findUnique({
      where: { id: body.postId },
      include: { site: { include: { client: { select: { companyId: true } } } } },
    });
    if (!post) throw new NotFoundException('Puesto no encontrado');
    await this.assertAccess(user, post.site.client.companyId);

    return this.prisma.consign.create({
      data: {
        postId: body.postId,
        title: body.title,
        content: body.content,
        version: body.version || '1.0',
        authorId: user.id,
        status: 'activo',
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const { consign, companyId } = await this.resolveConsignCompany(id);
    if (!consign) throw new NotFoundException('Consigna no encontrada');
    await this.assertAccess(user, companyId);

    // Guardar historial de la versión anterior
    const previousVersion = parseInt(consign.version) || 1;
    const newVersion = (previousVersion + 0.1).toFixed(1);

    await this.prisma.consignHistory.create({
      data: {
        consignId: id,
        version: consign.version,
        content: consign.content,
        changedById: user.id,
      },
    });

    return this.prisma.consign.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        version: newVersion,
        status: body.status || consign.status,
      },
    });
  }

  async ack(user: AuthUser, id: string) {
    if (!user.guardId) throw new ForbiddenException('El usuario no es guardia');
    const { consign } = await this.resolveConsignCompany(id);
    if (!consign) throw new NotFoundException('Consigna no encontrada');
    const guard = await this.prisma.guard.findUnique({ where: { id: user.guardId } });
    await this.assertAccess(user, guard?.companyId ?? null);

    return this.prisma.consignAck.upsert({
      where: { consignId_guardId: { consignId: id, guardId: user.guardId } },
      create: { consignId: id, guardId: user.guardId },
      update: { ackedAt: new Date() },
    });
  }
}