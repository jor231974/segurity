import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoStorageService } from './video-storage.service';

const DEFAULT_EXPIRATION_HOURS = 48;
const MAX_FRAGMENT_BYTES = 25 * 1024 * 1024;
const SIGNED_URL_TTL_MINUTES = 60;

function bigIntToNumber(value: unknown): number {
  return typeof value === 'bigint' ? Number(value) : (value as number);
}

export interface StreamConfig {
  resolution?: string;
  fps?: number;
  bitrate?: number;
  audioEnabled?: boolean;
  platform?: string;
  deviceId?: string;
  maxDurationSec?: number;
}

interface AuditContext {
  ip?: string;
  device?: string;
}

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VideoStorageService,
    private readonly config: ConfigService,
  ) {}

  private getExpirationHours(): number {
    const raw = this.config.get<string>('VIDEO_EXPIRATION_HOURS', String(DEFAULT_EXPIRATION_HOURS));
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_EXPIRATION_HOURS;
  }

  private getSignSecret(): string {
    return this.config.get<string>('VIDEO_SIGN_SECRET') ?? this.config.get<string>('JWT_SECRET', 'seguridad-video-sign');
  }

  private cfg(name: string, fallback: string): string {
    return this.config.get<string>(name, fallback);
  }

  /**
   * Configuración de captura que el dispositivo del guardia debe usar.
   * Valores por defecto vía variables de entorno; un despliegue puede
   * sobrescribirlos por empresa en el futuro (operationalParams).
   */
  async getConfig(user: AuthUser) {
    const audioDefault = this.cfg('VIDEO_DEFAULT_AUDIO', 'true');
    return {
      resolution: this.cfg('VIDEO_DEFAULT_RESOLUTION', '1280x720'),
      fps: parseInt(this.cfg('VIDEO_DEFAULT_FPS', '15'), 10),
      bitrate: parseInt(this.cfg('VIDEO_DEFAULT_BITRATE', '1200'), 10),
      audioEnabled: audioDefault !== 'false' && audioDefault !== '0',
      maxDurationSec: parseInt(this.cfg('VIDEO_MAX_DURATION_SEC', '0'), 10),
      fragmentSec: parseInt(this.cfg('VIDEO_FRAGMENT_SEC', '5'), 10),
      expirationHours: this.getExpirationHours(),
      mimeType: this.cfg('VIDEO_MIME_TYPE', 'video/webm;codecs=vp8,opus'),
    };
  }

  private async logAudit(
    companyId: string,
    action: string,
    data: { videoId?: string; streamId?: string; userId?: string; detail?: Record<string, unknown> },
    ctx?: AuditContext,
  ) {
    try {
      await this.prisma.videoAuditLog.create({
        data: {
          companyId,
          videoId: data.videoId,
          streamId: data.streamId,
          userId: data.userId,
          action,
          ip: ctx?.ip,
          device: ctx?.device ? ctx.device.slice(0, 255) : undefined,
          detail: data.detail ? (data.detail as any) : undefined,
        },
      });
    } catch (err) {
      console.error('[Video] No se pudo registrar auditoría', (err as Error).message);
    }
  }

  async getActiveStreams(user: AuthUser) {
    return this.prisma.videoStream
      .findMany({
        where: {
          companyId: user.companyId ?? undefined,
          status: { in: ['iniciada', 'transmitiendo'] },
        },
        include: {
          guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          post: { select: { id: true, name: true, site: { select: { id: true, name: true } } } },
          service: { select: { id: true, name: true } },
          client: { select: { id: true, commercialName: true } },
          shift: { select: { id: true, date: true, startTime: true, endTime: true } },
        },
        orderBy: { startedAt: 'desc' },
      })
      .then((streams) => streams.map((s) => ({ ...s, currentBytes: bigIntToNumber(s.currentBytes) })));
  }

  async startStream(user: AuthUser, body: StreamConfig & { latitude?: number; longitude?: number; serviceId?: string; postId?: string }) {
    if (!user.guardId) throw new ForbiddenException('Solo el guardia puede iniciar una transmisión');
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');

    const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
    const todayEnd = new Date(new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z');

    const currentShift = await this.prisma.shift.findFirst({
      where: {
        guardId: user.guardId,
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ['programado', 'activo'] },
      },
      include: { post: { select: { id: true, siteId: true } } },
      orderBy: { date: 'desc' },
    });

    const serviceId = currentShift?.serviceId ?? body.serviceId ?? undefined;
    const postId = body.postId ?? currentShift?.postId ?? undefined;
    const post = postId
      ? await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true, siteId: true, site: { select: { clientId: true } } } })
      : null;
    const siteId = post?.siteId ?? (serviceId ? (await this.prisma.contractService.findUnique({ where: { id: serviceId }, select: { siteId: true } }))?.siteId : undefined);
    const clientId = post?.site?.clientId ?? (siteId ? (await this.prisma.site.findUnique({ where: { id: siteId }, select: { clientId: true } }))?.clientId : undefined);

    if (serviceId) {
      const svc = await this.prisma.contractService.findUnique({
        where: { id: serviceId },
        include: { contract: { select: { companyId: true } } },
      });
      if (!svc || svc.contract.companyId !== user.companyId) throw new BadRequestException('Servicio inválido');
    }
    if (clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: clientId }, select: { companyId: true } });
      if (!client || client.companyId !== user.companyId) throw new BadRequestException('Cliente inválido');
    }

    const stream = await this.prisma.videoStream.create({
      data: {
        companyId: user.companyId,
        guardId: user.guardId,
        shiftId: currentShift?.id ?? undefined,
        serviceId,
        postId,
        siteId: siteId ?? undefined,
        clientId: clientId ?? undefined,
        latitude: body.latitude,
        longitude: body.longitude,
        status: 'transmitiendo',
        resolution: body.resolution,
        fps: body.fps,
        bitrate: body.bitrate,
        audioEnabled: body.audioEnabled !== undefined ? body.audioEnabled : true,
        platform: body.platform,
        deviceId: body.deviceId,
        maxDurationSec: body.maxDurationSec && body.maxDurationSec > 0 ? body.maxDurationSec : undefined,
      },
    });

    await this.logAudit(user.companyId, 'stream.start', {
      streamId: stream.id,
      userId: user.id,
      detail: { serviceId: serviceId ?? null, postId: postId ?? null, siteId: siteId ?? null, clientId: clientId ?? null },
    });

    return this.prisma.videoStream
      .findUnique({
        where: { id: stream.id },
        include: {
          guard: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          post: { select: { id: true, name: true, site: { select: { id: true, name: true } } } },
          service: { select: { id: true, name: true } },
          client: { select: { id: true, commercialName: true } },
          shift: { select: { id: true, date: true, startTime: true, endTime: true } },
        },
      })
      .then((s) => (s ? { ...s, currentBytes: bigIntToNumber(s.currentBytes) } : s));
  }

  /**
   * Guardar fragmento de grabación de forma idempotente por (streamId, sequence).
   * El guardia reenvía fragmentos si la cola offline no recibió confirmación.
   */
  async saveFragment(user: AuthUser, streamId: string, seq: number, buffer: Buffer) {
    if (!buffer || buffer.length === 0) throw new BadRequestException('Fragmento vacío');
    if (buffer.length > MAX_FRAGMENT_BYTES) throw new BadRequestException('Fragmento demasiado grande');
    if (!Number.isInteger(seq) || seq < 0) throw new BadRequestException('Secuencia inválida');

    const stream = await this.prisma.videoStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (stream.status !== 'transmitiendo' && stream.status !== 'iniciada') {
      throw new BadRequestException('La transmisión no está activa');
    }

    const existing = await this.prisma.videoFragment.findUnique({ where: { streamId_sequence: { streamId, sequence: seq } } });
    if (existing && existing.sizeBytes === BigInt(buffer.length)) {
      await this.prisma.videoStream.update({
        where: { id: streamId },
        data: { lastFragmentAt: new Date() },
      });
      return { receivedBytes: buffer.length, sequence: seq, duplicate: true, totalBytes: bigIntToNumber(stream.currentBytes) };
    }

    const { objectKey, sizeBytes } = await this.storage.putFragment(streamId, seq, buffer);

    const totalBytes = await this.storage.totalLiveBytes(streamId);
    const saved = await this.prisma.videoFragment.upsert({
      where: { streamId_sequence: { streamId, sequence: seq } },
      create: { streamId, sequence: seq, sizeBytes: BigInt(sizeBytes), objectKey },
      update: { sizeBytes: BigInt(sizeBytes), objectKey },
    });

    const fragmentCount = await this.prisma.videoFragment.count({ where: { streamId } });

    await this.prisma.videoStream.update({
      where: { id: streamId },
      data: {
        currentBytes: BigInt(totalBytes),
        fragmentCount,
        lastFragmentAt: new Date(),
      },
    });

    return { receivedBytes: buffer.length, sequence: seq, duplicate: false, totalBytes };
  }

  /** Chunk retrocompatible: equivale a un fragmento con secuencia implícita. */
  async saveChunk(user: AuthUser, streamId: string, buffer: Buffer) {
    const stream = await this.prisma.videoStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (stream.status !== 'transmitiendo' && stream.status !== 'iniciada') {
      throw new BadRequestException('La transmisión no está activa');
    }
    const seq = stream.fragmentCount;
    return this.saveFragment(user, streamId, seq, buffer);
  }

  /** Manifest para el reproductor en vivo (MSE) del supervisor. */
  async getLiveManifest(user: AuthUser, streamId: string) {
    const stream = await this.prisma.videoStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (stream.status !== 'transmitiendo' && stream.status !== 'iniciada') {
      throw new BadRequestException('La transmisión no está activa');
    }

    const fragments = await this.storage.listFragments(streamId);
    await this.logAudit(user.companyId, 'live.view', { streamId, userId: user.id });

    return {
      streamId,
      status: stream.status,
      fragmentCount: stream.fragmentCount,
      totalBytes: bigIntToNumber(stream.currentBytes),
      lastFragmentAt: stream.lastFragmentAt,
      fragments,
    };
  }

  async getFragmentFile(user: AuthUser, streamId: string, seq: number) {
    const stream = await this.prisma.videoStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    const sizeBytes = this.storage.getFragmentSize(streamId, seq);
    if (sizeBytes === 0) throw new NotFoundException('Fragmento no disponible');
    return { stream: this.storage.getFragmentStream(streamId, seq), sizeBytes };
  }

  async endStream(user: AuthUser, id: string, ctx?: AuditContext) {
    const stream = await this.prisma.videoStream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Transmisión no encontrada');
    if (stream.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    if (stream.status === 'finalizada') throw new BadRequestException('La transmisión ya fue finalizada');

    const now = new Date();
    const durationSec = Math.max(1, Math.floor((now.getTime() - stream.startedAt.getTime()) / 1000));

    const fragments = await this.storage.listFragments(id);
    const fragmentCount = fragments.length;

    if (fragmentCount === 0) {
      await this.storage.discardLive(id);
      const aborted = await this.prisma.videoStream.update({ where: { id }, data: { status: 'fallida', endedAt: now } });
      await this.logAudit(stream.companyId, 'stream.end', { streamId: id, userId: user.id, detail: { aborted: true, reason: 'sin fragmentos' } }, ctx);
      return { stream: { ...aborted, currentBytes: bigIntToNumber(aborted.currentBytes) }, recording: null, aborted: true, reason: 'La transmisión terminó sin fragmentos (sin grabación)' };
    }

    const hours = this.getExpirationHours();
    const expiresAt = new Date(now.getTime() + hours * 3600 * 1000);
    const recordingId = id;
    const filePath = `recordings/${recordingId}.webm`;
    const sizeBytes = await this.storage.concatToRecording(id, recordingId, filePath, fragmentCount);

    const [updatedStream, recording] = await this.prisma.$transaction([
      this.prisma.videoStream.update({ where: { id }, data: { status: 'finalizada', endedAt: now } }),
      this.prisma.videoRecording.create({
        data: {
          companyId: stream.companyId,
          streamId: id,
          guardId: stream.guardId,
          shiftId: stream.shiftId,
          serviceId: stream.serviceId,
          postId: stream.postId,
          siteId: stream.siteId,
          clientId: stream.clientId,
          latitude: stream.latitude,
          longitude: stream.longitude,
          filePath,
          objectKey: `recordings/${recordingId}.webm`,
          sizeBytes: BigInt(sizeBytes),
          fragmentCount,
          format: 'webm',
          durationSec,
          resolution: stream.resolution,
          fps: stream.fps,
          bitrate: stream.bitrate,
          audioEnabled: stream.audioEnabled,
          retentionPolicy: 'temporal',
          expiresAt,
        },
      }),
    ]);

    await this.prisma.videoFragment.updateMany({ where: { streamId: id }, data: { recordingId: recording.id } });
    await this.storage.discardLive(id);
    await this.logAudit(stream.companyId, 'stream.end', { streamId: id, videoId: recording.id, userId: user.id, detail: { fragmentCount, sizeBytes } }, ctx);

    return {
      stream: { ...updatedStream, currentBytes: bigIntToNumber(updatedStream.currentBytes) },
      recording: { ...recording, sizeBytes: bigIntToNumber(recording.sizeBytes), expiresAt, hoursUntilExpiration: hours },
      aborted: false,
    };
  }

  private async assertCanAccess(user: AuthUser, rec: { companyId: string; deletedAt: Date | null; expiresAt: Date | null; retentionPolicy: string }) {
    if (rec.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.expiresAt && rec.expiresAt <= new Date() && rec.retentionPolicy !== 'evidencia') {
      throw new BadRequestException('Grabación expirada');
    }
  }

  async getRecordingFile(user: AuthUser, id: string, ctx?: AuditContext) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    await this.assertCanAccess(user, rec);

    const stats = this.storage.getRecordingStats(rec.filePath);
    const stream = this.storage.getRecordingStream(rec.filePath);

    await this.prisma.videoDownloadLog.create({ data: { videoId: id, userId: user.id, reason: 'Reproducción (streaming)' } });
    await this.logAudit(rec.companyId, 'recording.view', { videoId: id, userId: user.id }, ctx);

    return { stream, sizeBytes: stats.sizeBytes, rec };
  }

  async getRecordings(user: AuthUser, query: { guardId?: string; incidentId?: string; siteId?: string; clientId?: string; date?: string; retention?: string }) {
    const where: any = { companyId: user.companyId, deletedAt: null };
    if (query.guardId) where.guardId = query.guardId;
    if (query.incidentId) where.incidentId = query.incidentId;
    if (query.siteId) where.siteId = query.siteId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.retention) where.retentionPolicy = query.retention;
    if (query.date) {
      where.createdAt = { gte: new Date(query.date + 'T00:00:00.000Z'), lte: new Date(query.date + 'T23:59:59.999Z') };
    }

    return this.prisma.videoRecording.findMany({
      where,
      include: {
        guard: { select: { id: true, firstName: true, lastName: true } },
        incident: { select: { id: true, typeName: true, status: true } },
        site: { select: { id: true, name: true } },
        post: { select: { id: true, name: true } },
        client: { select: { id: true, commercialName: true } },
        evidenceBy: { select: { id: true, name: true, lastName: true } },
        stream: { select: { status: true } },
        _count: { select: { downloads: true, audits: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).then((recs) =>
      recs.map((r) => ({
        ...r,
        sizeBytes: bigIntToNumber(r.sizeBytes),
        hoursUntilExpiration:
          r.expiresAt && r.retentionPolicy !== 'evidencia'
            ? Math.max(0, Math.round((r.expiresAt.getTime() - new Date().getTime()) / 3600000))
            : null,
      })),
    );
  }

  async getRecording(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({
      where: { id },
      include: {
        guard: true,
        incident: true,
        site: { select: { id: true, name: true, address: true } },
        post: { select: { id: true, name: true } },
        client: { select: { id: true, commercialName: true, legalName: true } },
        service: { select: { id: true, name: true } },
        evidenceBy: { select: { id: true, name: true, lastName: true } },
        downloads: {
          include: { user: { select: { id: true, name: true, lastName: true } } },
          orderBy: { downloadedAt: 'desc' },
        },
        audits: { orderBy: { createdAt: 'desc' }, take: 50 },
        stream: true,
      },
    });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    await this.assertCanAccess(user, rec);
    const now = new Date();
    return {
      ...rec,
      sizeBytes: bigIntToNumber(rec.sizeBytes),
      expired: !!rec.expiresAt && rec.expiresAt <= now && rec.retentionPolicy !== 'evidencia',
      hoursUntilExpiration:
        rec.expiresAt && rec.retentionPolicy !== 'evidencia'
          ? Math.max(0, Math.round((rec.expiresAt.getTime() - now.getTime()) / 3600000))
          : null,
    };
  }

  async getRecordingAudits(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id }, select: { companyId: true, deletedAt: true } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) throw new ForbiddenException('Acceso denegado');
    return this.prisma.videoAuditLog.findMany({
      where: { videoId: id },
      include: { user: { select: { id: true, name: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** Generar URL temporal firmada para descarga directa sin credenciales. */
  async createSignedUrl(user: AuthUser, id: string) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (rec.expiresAt && rec.expiresAt <= new Date() && rec.retentionPolicy !== 'evidencia') {
      throw new BadRequestException('Grabación expirada');
    }

    const ttlMinutes = parseInt(this.cfg('VIDEO_SIGNED_URL_TTL_MINUTES', String(SIGNED_URL_TTL_MINUTES)), 10);
    const exp = Date.now() + ttlMinutes * 60 * 1000;
    const token = this.signToken(id, exp);

    await this.prisma.videoDownloadLog.create({ data: { videoId: id, userId: user.id, reason: 'URL firmada generada' } });
    await this.logAudit(rec.companyId, 'recording.download_url', { videoId: id, userId: user.id, detail: { ttlMinutes } });

    return { url: `/api/video/download/${token}`, expiresInMinutes: ttlMinutes, message: `URL temporal firmada, válida por ${ttlMinutes} minutos` };
  }

  private signToken(videoId: string, exp: number): string {
    const expBase64 = Buffer.from(String(exp)).toString('base64url');
    const payload = `${videoId}.${expBase64}`;
    const sig = createHmac('sha256', this.getSignSecret()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  private verifyToken(token: string): { videoId: string; exp: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [videoId, expBase64, sig] = parts;
    const payload = `${videoId}.${expBase64}`;
    const expected = createHmac('sha256', this.getSignSecret()).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const exp = parseInt(Buffer.from(expBase64, 'base64url').toString('utf8'), 10);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    return { videoId, exp };
  }

  /** Descarga mediante URL firmada (sin sesión). Auditoría con IP y dispositivo. */
  async consumeSignedUrl(token: string, ctx?: AuditContext) {
    const parsed = this.verifyToken(token);
    if (!parsed) throw new BadRequestException('URL firmada inválida o expirada');

    const rec = await this.prisma.videoRecording.findUnique({ where: { id: parsed.videoId } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.expiresAt && rec.expiresAt <= new Date() && rec.retentionPolicy !== 'evidencia') {
      throw new BadRequestException('Grabación expirada');
    }

    const stats = this.storage.getRecordingStats(rec.filePath);
    const stream = this.storage.getRecordingStream(rec.filePath);
    await this.logAudit(rec.companyId, 'recording.download', { videoId: rec.id, detail: { signed: true } }, ctx);

    return { stream, sizeBytes: stats.sizeBytes, rec };
  }

  async preserveEvidence(user: AuthUser, id: string, reason: string, ctx?: AuditContext) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (!reason || !reason.trim()) throw new BadRequestException('Se requiere el motivo para conservar la evidencia');

    const preserved = await this.prisma.videoRecording.update({
      where: { id },
      data: {
        retentionPolicy: 'evidencia',
        evidenceReason: reason.trim(),
        evidenceById: user.id,
        evidenceAt: new Date(),
        expiresAt: null,
      },
    });

    await this.logAudit(rec.companyId, 'evidence.preserve', { videoId: id, userId: user.id, detail: { reason: reason.trim() } }, ctx);

    return { ...preserved, sizeBytes: bigIntToNumber(preserved.sizeBytes) };
  }

  async assignIncident(user: AuthUser, id: string, incidentId: string, ctx?: AuditContext) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.deletedAt) throw new NotFoundException('Grabación eliminada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident || incident.companyId !== user.companyId) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    const updated = await this.prisma.videoRecording.update({ where: { id }, data: { incidentId } });
    await this.logAudit(rec.companyId, 'recording.incident', { videoId: id, userId: user.id, detail: { incidentId } }, ctx);

    return { ...updated, sizeBytes: bigIntToNumber(updated.sizeBytes) };
  }

  async deleteRecording(user: AuthUser, id: string, ctx?: AuditContext) {
    const rec = await this.prisma.videoRecording.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Grabación no encontrada');
    if (rec.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (rec.deletedAt) throw new NotFoundException('Grabación ya eliminada');

    await this.storage.deleteRecording(rec.filePath);
    const updated = await this.prisma.videoRecording.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.logAudit(rec.companyId, 'recording.delete', { videoId: id, userId: user.id, detail: { retention: rec.retentionPolicy } }, ctx);

    return { ...updated, sizeBytes: bigIntToNumber(updated.sizeBytes) };
  }

  // Tarea programada: eliminar videos temporales expirados (la evidencia no expira).
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredVideos() {
    const now = new Date();
    const expired = await this.prisma.videoRecording.findMany({
      where: { retentionPolicy: 'temporal', expiresAt: { lte: now }, deletedAt: null },
      select: { id: true, filePath: true, companyId: true },
    });

    if (expired.length === 0) return;

    for (const rec of expired) {
      try {
        await this.storage.deleteRecording(rec.filePath);
        await this.prisma.videoRecording.update({ where: { id: rec.id }, data: { deletedAt: now } });
        await this.logAudit(rec.companyId, 'automatic.expire', { videoId: rec.id });
      } catch (err) {
        console.error(`[Video] Error al expirar ${rec.id}:`, (err as Error).message);
      }
    }

    // Transmisiones abandonadas (sin fragmentos en 3 minutos, o iniciadas sin
    // actividad por 10 minutos) se revierten a fallidas para liberar recursos.
    const staleFragmentAt = new Date(now.getTime() - 3 * 60 * 1000);
    const abandonedSince = new Date(now.getTime() - 10 * 60 * 1000);
    const abandoned = await this.prisma.videoStream.findMany({
      where: {
        status: { in: ['iniciada', 'transmitiendo'] },
        OR: [{ lastFragmentAt: { lt: staleFragmentAt } }, { lastFragmentAt: null, startedAt: { lt: abandonedSince } }],
      },
      select: { id: true, companyId: true },
    });
    for (const s of abandoned) {
      try {
        await this.prisma.videoStream.update({ where: { id: s.id }, data: { status: 'fallida', endedAt: now } });
        await this.logAudit(s.companyId, 'automatic.expire', { streamId: s.id, detail: { reason: 'sin actividad' } });
      } catch {}
    }

    console.log(`[Video] Expiración: ${expired.length} grabaciones temporales y ${abandoned.length} transmisiones abandonadas procesadas`);
  }
}