import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async check() {
    let db = 'ok';
    let dbError: string | null = null;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      db = 'error';
      dbError = err?.message?.slice(0, 200) ?? 'Error desconocido';
    }

    return {
      status: db === 'ok' ? 'ok' : 'degradado',
      service: 'api',
      version: '1.0.0',
      environment: this.config.get<string>('NODE_ENV', 'development'),
      database: db,
      ...(dbError ? { databaseError: dbError } : {}),
      timestamp: new Date().toISOString(),
    };
  }
}