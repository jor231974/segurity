import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

const AUDITED = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const user = request.user;

    if (!AUDITED.includes(method) || !user) return next.handle();

    const module = (context.getClass().name || 'desconocido').replace('Controller', '');
    const action = `${method} ${request.route?.path || request.url}`;

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              companyId: user.companyId || null,
              userId: user.id,
              ip: request.ip,
              device: request.headers['user-agent']?.substring(0, 255),
              module,
              action,
              entity: request.params?.id ? request.route?.path : request.url.split('?')[0],
              entityId: request.params?.id || null,
            },
          });
        } catch {
          // El registro de auditoría no debe romper la petición
        }
      }),
    );
  }
}