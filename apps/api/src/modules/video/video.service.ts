import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoStorageService } from './video-storage.service';

const VIDEO_EXPIRATION_HOURS = 48;
const MAX_CHUNK_BYTES = 25 * 1024 * 1024;

function bigIntToNumber(value: unknown): number {
  return typeof value === 'bigint' ? Number(value) : (value as number);
}

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VideoStorageService,
    private readonly config: ConfigService,
  ) {}

  private getVideoExpirationHours(): number {
    const v = this.config.get<string>('VIDEO_EXPIRATION_HOURS', '48');
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : VIDEO_EXPIRATION_HOURS;
  }

  async getActiveStreams(user: AuthUser) {
    return this.prisma.videoStream.findMany({
      where: {
companyId: user.companyId ?? undefined,
        status: { in: ['iniciada', 'transmitiendo'] },
      },
      include: {
        guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        shift: { include: { post: { include: { site: { select: { id: true, name: true } } } } } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async startStream(user: AuthUser, body: { latitude?: number; longitude?: number; serviceId?: string; platform?: string; deviceId?: string }) {
    if (!user.guardId) throw new ForbiddenException('Solo el guardia puede iniciar una transmisión');
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');

    const currentShift = await this.prisma.shift.findFirst({
      where: {
        guardId: user.guardId,
        date: { lte: new Date(new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z'), gte: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') },
        status: { in: ['programado', 'activo'] },
      },
      orderBy: { date: 'desc' },
    });

    const stream = await this.prisma.videoStream.create({
      data: {
        companyId: user.companyId,
        guardId: user.guardId,
        shiftId: currentShift?.id ?? undefined,
        serviceId: currentShift?.serviceId ?? body.serviceId ?? undefined,
        latitude: body.latitude,
        longitude: body.longitude,
        status: 'transmitiendo',
      },
    });

    return this.prisma.videoStream.findUnique({
      where: { id: stream.id },
      include: {
        guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        shift: { include: { post: { include: { site: { select: { id: true, name: true } } } } } },
      },
    });
  }

  async saveChunk(user: AuthUser, streamId: string, buffer: Buffer) {
    if (!buffer || buffer.length === 0) throw new BadRequestException('Chunk vacío');
    if (buffer.length > MAX_CHUNK_BYTES) throw new BadRequestException('Chunk demasiado grande');

    const stream = await this.prisma.videoStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (stream.status !== 'transmitiendo') throw new BadRequestException('La transmisión no está activa');

    const sizeBytes = await this.storage.appendChunk(streamId, buffer);
    await this.prisma.videoStream.update({
      where: { id: streamId },
      data: { viewerCount: Math.min(9, stream.viewerCount) },
    });
    return { receivedBytes: buffer.length, totalBytes: sizeBytes };
  }

  async getRecordingFile(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.expiresAt <= new Date()) throw new BadRequestException('Grabación expirada');
    if (rec.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }

    const stats = this.storage.getRecordingStats(rec.filePath);
    const stream = this.storage.getRecordingStream(rec.filePath);

    await this.prisma.videoDownloadLog.create({
      data: { videoId: id, userId: user.id, reason: 'Descarga controlada (streaming)' },
    });

    return { stream, sizeBytes: stats.sizeBytes };
  }

  async endStream(user: AuthUser, id: string) {
    const stream = await this.prisma.videoStream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }

    const now = new Date();
    const durationSec = Math.max(1, Math.floor((now.getTime() - stream.startedAt.getTime()) / 1000));
    const expiresAt = new Date(now.getTime() + this.getVideoExpirationHours() * 3600 * 1000);

    const finalized = await this.storage.finalize(id);
    const sizeBytes = finalized.sizeBytes || 0;

    const [updatedStream, recording] = await this.prisma.$transaction([
      this.prisma.videoStream.update({ where: { id }, data: { status: 'finalizada', endedAt: now } }),
      this.prisma.videoRecording.create({
        data: {
          companyId: stream.companyId,
          streamId: id,
          guardId: stream.guardId,
          shiftId: stream.shiftId,
          latitude: stream.latitude,
          longitude: stream.longitude,
          filePath: `recordings/${id}.webm`,
          sizeBytes: BigInt(sizeBytes),
          format: 'webm',
          durationSec,
          resolution: '640x480',
          expiresAt,
        },
      }),
    ]);

    return { stream: updatedStream, recording: { ...recording, sizeBytes: bigIntToNumber(recording.sizeBytes), expiresAt, hoursUntilExpiration: this.getVideoExpirationHours() } };
  }

  async getRecordings(user: AuthUser, query: { guardId?: string; incidentId?: string; date?: string }) {
    const where: any = { companyId: user.companyId, deletedAt: null };
    if (query.guardId) where.guardId = query.guardId;
    if (query.incidentId) where.incidentId = query.incidentId;
    if (query.date) {
      const start = new Date(query.date + 'T00:00:00.000Z');
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.createdAt = { gte: start, lte: end };
    }

    return this.prisma.videoRecording.findMany({
      where,
      include: {
        guard: { select: { id: true, firstName: true, lastName: true } },
        incident: { select: { id: true, typeName: true, status: true } },
        stream: { select: { status: true } },
        _count: { select: { downloads: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).then((recs) => recs.map((r) => ({ ...r, sizeBytes: bigIntToNumber(r.sizeBytes) })));
  }

  async getRecording(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({
      where: { id },
      include: {
        guard: true,
        incident: true,
        stream: true,
        downloads: {
          include: { user: { select: { id: true, name: true, lastName: true } } },
          orderBy: { downloadedAt: 'desc' },
        },
      },
    });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    const now = new Date();
    return { ...rec, sizeBytes: bigIntToNumber(rec.sizeBytes), expired: rec.expiresAt <= now, hoursUntilExpiration: Math.max(0, Math.round((rec.expiresAt.getTime() - now.getTime()) / 3600000)) };
  }

  async getDownloadUrl(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt || rec.expiresAt <= new Date()) throw new BadRequestException('Grabación expirada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    await this.prisma.videoDownloadLog.create({
      data: {
        videoId: id,
        userId: user.id,
        reason: 'Descarga manual',
      },
    });

    return {
      url: `/api/video/recordings/${id}/file`,
      expiresInMinutes: 60,
      message: 'URL temporal válida por 60 minutos',
    };
  }

  async assignIncident(user: AuthUser, id: string, incidentId: string) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident || incident.companyId !== user.companyId) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    return this.prisma.videoRecording
      .update({
        where: { id },
        data: { incidentId },
      })
      .then((rec) => ({ ...rec, sizeBytes: bigIntToNumber(rec.sizeBytes) }));
  }

  async deleteRecording(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    await this.storage.deleteRecording(rec.filePath);

    return this.prisma.videoRecording
      .update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      .then((rec) => ({ ...rec, sizeBytes: bigIntToNumber(rec.sizeBytes) }));
  }

  // Tarea programada: eliminar videos expirados cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredVideos() {
    const now = new Date();
    const expired = await this.prisma.videoRecording.findMany({
      where: { expiresAt: { lte: now }, deletedAt: null },
      select: { id: true, filePath: true },
    });

    if (expired.length === 0) return;

    for (const rec of expired) {
      try {
        await this.storage.deleteRecording(rec.filePath);
        await this.prisma.videoRecording.update({
          where: { id: rec.id },
          data: { deletedAt: now },
        });
      } catch {}
    }

    console.log(`[Video] ${expired.length} grabaciones expiradas eliminadas (archivo + registro)`);
  }
}