import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { page: string; limit: string; search?: string }) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search?.trim();

    const where: any = { companyId: user.companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          phone: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
        },
      }),
    ]);

    return { total, page, limit, items };
  }

  async findOne(user: AuthUser, id: string) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        sessions: { where: { revokedAt: null } },
      },
    });
    if (!record) throw new NotFoundException('Usuario no encontrado');
    if (record.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    return record;
  }

  async create(user: AuthUser, body: any) {
    if (!body.email || !body.name || !body.lastName || !body.password) {
      throw new BadRequestException('Faltan campos requeridos');
    }
    const exists = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
    });
    if (exists) throw new BadRequestException('Ya existe un usuario con ese correo');

    const passwordHash = await bcrypt.hash(body.password, 12);
    const role = await this.prisma.role.findUnique({ where: { code: body.roleCode } });
    if (!role) throw new BadRequestException('Rol inválido');

    return this.prisma.user.create({
      data: {
        companyId: user.companyId,
        email: body.email.toLowerCase().trim(),
        passwordHash,
        name: body.name,
        lastName: body.lastName,
        phone: body.phone,
        active: body.active ?? true,
        mustChangePassword: true,
        userRoles: {
          create: { roleId: role.id },
        },
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        active: true,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Usuario no encontrado');
    if (record.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }

    const data: any = {
      name: body.name,
      lastName: body.lastName,
      phone: body.phone,
      active: body.active,
    };

    if (body.roleCode) {
      const role = await this.prisma.role.findUnique({ where: { code: body.roleCode } });
      if (!role) throw new BadRequestException('Rol inválido');
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.create({ data: { userId: id, roleId: role.id } });
    }

    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 12);
      data.mustChangePassword = true;
    }

    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(user: AuthUser, id: string) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Usuario no encontrado');
    if (record.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    if (record.id === user.id) throw new BadRequestException('No puedes eliminar tu propio usuario');
    return this.prisma.user.update({ where: { id }, data: { active: false } });
  }

  async toggleActive(user: AuthUser, id: string, active: boolean) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Usuario no encontrado');
    if (record.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    return this.prisma.user.update({ where: { id }, data: { active } });
  }

  async getLoginHistory(id: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}