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

  private static readonly TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

  private static assertValidTime(value: any, label: string) {
    if (!PostsService.TIME_RE.test(value)) {
      throw new BadRequestException(`${label} inválido (formato HH:mm)`);
    }
  }

  private static coerceBoolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  }

  async create(user: AuthUser, body: any) {
    const site = await this.prisma.site.findUnique({
      where: { id: body.siteId },
      include: { client: { select: { companyId: true } } },
    });
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    await this.assertAccess(user, site.client.companyId);

    if (!body.name?.trim()) throw new BadRequestException('name es obligatorio');
    PostsService.assertValidTime(body.shiftStart, 'shiftStart');
    PostsService.assertValidTime(body.shiftEnd, 'shiftEnd');

    return this.prisma.post.create({
      data: {
        siteId: body.siteId,
        name: body.name,
        shiftStart: body.shiftStart,
        shiftEnd: body.shiftEnd,
        active: PostsService.coerceBoolean(body.active, true),
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const { post, companyId } = await this.resolvePostCompany(id);
    if (!post) throw new NotFoundException('Puesto no encontrado');
    await this.assertAccess(user, companyId);

    if (body.name !== undefined && !body.name?.trim()) throw new BadRequestException('name no puede quedar vacío');
    if (body.shiftStart) PostsService.assertValidTime(body.shiftStart, 'shiftStart');
    if (body.shiftEnd) PostsService.assertValidTime(body.shiftEnd, 'shiftEnd');

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.shiftStart && { shiftStart: body.shiftStart }),
        ...(body.shiftEnd && { shiftEnd: body.shiftEnd }),
        ...(body.active !== undefined && { active: PostsService.coerceBoolean(body.active, post.active) }),
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