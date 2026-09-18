import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    if (!user) throw new ForbiddenException('Permiso denegado');

    const isSuperAdmin = user.roleCodes?.includes('SUPER_ADMIN') ?? false;
    if (isSuperAdmin) return true;

    const hasPermission = required.every((perm) => user.permissions?.includes(perm));
    if (!hasPermission) throw new ForbiddenException('Permiso denegado');
    return true;
  }
}