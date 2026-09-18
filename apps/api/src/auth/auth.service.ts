import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ROLE_PERMISSIONS } from '@servicom/shared';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const FAILED_ATTEMPTS: Record<string, { count: number; lockedUntil?: Date }> = {};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private getRolePermissionsCache(): Record<string, string[]> {
    return ROLE_PERMISSIONS as unknown as Record<string, string[]>;
  }

  async login(email: string, password: string) {
    const key = email.toLowerCase().trim();
    const attempt = FAILED_ATTEMPTS[key];

    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Demasiados intentos. Cuenta bloqueada. Intente después de ${Math.ceil(
          (attempt.lockedUntil.getTime() - Date.now()) / 60000,
        )} minutos`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: key },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.active) {
      await this.registerLoginHistory(null, key, false, 'Usuario no encontrado o inactivo');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const current = FAILED_ATTEMPTS[key] || { count: 0 };
      current.count += 1;
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        current.count = 0;
      }
      FAILED_ATTEMPTS[key] = current;
      await this.registerLoginHistory(user.id, key, false, 'Contraseña incorrecta');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    delete FAILED_ATTEMPTS[key];

    const roleCodes = user.userRoles.map((ur) => ur.role.code);
    const permissions = this.getPermissionsForRoles(roleCodes);
    const guard = await this.prisma.guard.findUnique({ where: { userId: user.id } });
    const clientUser = await this.prisma.clientUser.findUnique({ where: { userId: user.id } });

    await this.registerLoginHistory(user.id, key, true, null);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      roleCodes,
      permissions,
      guardId: guard?.id ?? null,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        companyId: user.companyId,
        roleCodes,
        permissions,
        guardId: guard?.id ?? null,
        clientId: clientUser?.clientId ?? null,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  private getPermissionsForRoles(roleCodes: string[]): string[] {
    const perms = new Set<string>();
    for (const code of roleCodes) {
      const rolePerms = this.getRolePermissionsCache()[code] || [];
      rolePerms.forEach((p) => perms.add(p));
    }
    return Array.from(perms);
  }

  private async registerLoginHistory(
    userId: string | null,
    email: string,
    success: boolean,
    failureReason: string | null,
  ) {
    try {
      await this.prisma.loginHistory.create({
        data: {
          userId: userId || '00000000-0000-0000-0000-000000000000',
          email,
          success,
          failureReason,
        },
      });
    } catch {
      // no romper el login por auditoría
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        company: { select: { id: true, legalName: true, commercialName: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const roleCodes = user.userRoles.map((ur) => ur.role.code);
    const guard = await this.prisma.guard.findUnique({ where: { userId: user.id } });
    const clientUser = await this.prisma.clientUser.findUnique({ where: { userId: user.id } });

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId,
      company: user.company,
      roleCodes,
      permissions: this.getPermissionsForRoles(roleCodes),
      guardId: guard?.id ?? null,
      clientId: clientUser?.clientId ?? null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // No revelar si el usuario existe
      return { message: 'Si el correo existe, recibirá un enlace de recuperación' };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // En un entorno real se enviaría por correo. Aquí devolvemos el token para desarrollo.
    // TODO: integrar envío por email/SMS cuando se configure el proveedor.
    return { message: 'Token de recuperación generado', token: process.env.NODE_ENV === 'production' ? undefined : token };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Contraseña actualizada correctamente' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('La contraseña actual es incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
    // Revocar otras sesiones
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Contraseña actualizada' };
  }

  async logout(userId: string, token?: string) {
    if (token) {
      await this.prisma.session.updateMany({
        where: { token, userId },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Sesión cerrada' };
  }
}