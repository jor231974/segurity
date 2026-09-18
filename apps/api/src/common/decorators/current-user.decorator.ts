import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  companyId: string | null;
  roleCodes: string[];
  permissions: string[];
  guardId?: string | null;
  clientId?: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string | string[] | null | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);