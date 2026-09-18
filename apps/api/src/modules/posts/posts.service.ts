import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolvePostCompany(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { site: { include: { client: { select: { companyId: true } } } } },
    });
    return { post, companyId: post?.site?.client?.companyId ?? null };
  }

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser) {
    return this.prisma.post.findMany({
      where: { site: { client: { companyId: user.companyId ?? undefined } }, active: true },
      include: {
        site: { select: { id: true, name: true, client: { select: { commercialName: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        site: { include: { client: true } },
        consigns: { include: { author: { select: { name: true, lastName: true } } }, orderBy: { version: 'desc' } },
      },
    });
    if (!post) throw new NotFoundException('Puesto no encontrado');
    await this.assertAccess(user, post.site.client.companyId);
    return post;
  }

  async create(user: AuthUser, body: any) {
    const site = await this.prisma.site.findUnique({
      where: { id: body.siteId },
      include: { client: { select: { companyId: true } } },
    });
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, site.client.companyId);

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.shiftEnd)) {
      throw new BadRequestException('Horarios inválidos (formato HH:mm)');
    }

    return this.prisma.post.create({
      data: {
        siteId: body.siteId,
        name: body.name,
        shiftStart: body.shiftStart,
        shiftEnd: body.shiftEnd,
        active: body.active ?? true,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const { post, companyId } = await this.resolvePostCompany(id);
    if (!post) throw new NotFoundException('Puesto no encontrado');
    await this.assertAccess(user, companyId);

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.shiftStart && { shiftStart: body.shiftStart }),
        ...(body.shiftEnd && { shiftEnd: body.shiftEnd }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const { post, companyId } = await this.resolvePostCompany(id);
    if (!post) throw new NotFoundException('Puesto no encontrado');
    await this.assertAccess(user, companyId);
    return this.prisma.post.update({ where: { id }, data: { active: false } });
  }
}