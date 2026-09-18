import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSIONS } from '@servicom/shared';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { userRoles: { select: { userId: true } } },
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  async getRolePermissions(code: string) {
    // Permisos estáticos definidos en @servicom/shared y su reflejo en BD
    const staticPerms = ROLE_PERMISSIONS[code as keyof typeof ROLE_PERMISSIONS] || [];
    const dbPerms = await this.prisma.rolePermission.findMany({
      where: { role: { code } },
      include: { permission: true },
    });
    const dbCodes = dbPerms.map((p) => p.permission.code);
    return { roleCode: code, permissions: [...new Set([...staticPerms, ...dbCodes])] };
  }
}