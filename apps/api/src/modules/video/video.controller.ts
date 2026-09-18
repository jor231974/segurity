import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe, Request, Res, RawBodyRequest, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSIONS } from '@servicom/shared';
import type { Request as ExpressRequest, Response } from 'express';

function extractContext(req: ExpressRequest) {
  return { ip: req.ip, device: (req.headers['user-agent'] as string) || undefined };
}

@ApiTags('Video')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('config')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiOperation({ summary: 'Configuración de captura para el dispositivo del guardia' })
  getConfig(@CurrentUser() user: AuthUser) {
    return this.videoService.getConfig(user);
  }

  @Get('streams')
  @Permissions(PERMISSIONS.VIDEO_LIVE_VIEW)
  @ApiOperation({ summary: 'Listar transmisiones activas' })
  getActiveStreams(@CurrentUser() user: AuthUser) {
    return this.videoService.getActiveStreams(user);
  }

  @Post('streams')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiOperation({ summary: 'Iniciar transmisión desde la app del guardia' })
  startStream(
    @CurrentUser() user: AuthUser,
    @Body() body: { latitude?: number; longitude?: number; serviceId?: string; postId?: string; resolution?: string; fps?: number; bitrate?: number; audioEnabled?: boolean; platform?: string; deviceId?: string; maxDurationSec?: number },
    @Request() req: ExpressRequest,
  ) {
    return this.videoService.startStream(user, body || {});
  }

  @Post('streams/:id/fragments')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiConsumes('application/octet-stream')
  @ApiOperation({ summary: 'Subir fragmento numerado de la grabación (idempotente)' })
  saveFragment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('seq', ParseIntPipe) seq: number,
    @Request() req: RawBodyRequest<ExpressRequest>,
  ) {
    const buffer = Buffer.isBuffer(req.body) ? req.body : req.rawBody ?? Buffer.from([]);
    return this.videoService.saveFragment(user, id, seq, buffer);
  }

  @Post('streams/:id/chunk')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiConsumes('application/octet-stream')
  @ApiOperation({ summary: 'Subir chunk de grabación (retrocompatible)' })
  saveChunk(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RawBodyRequest<ExpressRequest>,
  ) {
    const buffer = Buffer.isBuffer(req.body) ? req.body : req.rawBody ?? Buffer.from([]);
    return this.videoService.saveChunk(user, id, buffer);
  }

  @Get('streams/:id/manifest')
  @Permissions(PERMISSIONS.VIDEO_LIVE_VIEW)
  @ApiOperation({ summary: 'Manifest de fragmentos para reproductor en vivo' })
  getLiveManifest(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    return this.videoService.getLiveManifest(user, id);
  }

  @Get('streams/:id/fragments/:seq')
  @Permissions(PERMISSIONS.VIDEO_LIVE_VIEW)
  @ApiOperation({ summary: 'Obtener un fragmento en vivo para el reproductor MSE' })
  async getFragment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('seq', ParseIntPipe) seq: number,
    @Res() res: Response,
  ) {
    const { stream, sizeBytes } = await this.videoService.getFragmentFile(user, id, seq);
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Length', String(sizeBytes));
    stream.pipe(res);
  }

  @Put('streams/:id/end')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiOperation({ summary: 'Finalizar transmisión y crear grabación con expiración 48h' })
  endStream(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: ExpressRequest,
  ) {
    return this.videoService.endStream(user, id, extractContext(req));
  }

  @Get('recordings')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Listar grabaciones con filtros' })
  getRecordings(
    @CurrentUser() user: AuthUser,
    @Query('guardId') guardId?: string,
    @Query('incidentId') incidentId?: string,
    @Query('siteId') siteId?: string,
    @Query('clientId') clientId?: string,
    @Query('date') date?: string,
    @Query('retention') retention?: string,
  ) {
    return this.videoService.getRecordings(user, { guardId, incidentId, siteId, clientId, date, retention });
  }

  @Get('recordings/:id')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Obtener grabación con contexto completo' })
  getRecording(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.getRecording(user, id);
  }

  @Get('recordings/:id/audit')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Historial de auditoría de una grabación' })
  getRecordingAudits(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.getRecordingAudits(user, id);
  }

  @Get('recordings/:id/file')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_DOWNLOAD)
  @ApiOperation({ summary: 'Reproducir/descargar archivo de grabación (URL controlada)' })
  async getFile(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Request() req: ExpressRequest,
  ) {
    const { stream, sizeBytes } = await this.videoService.getRecordingFile(user, id, extractContext(req));
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Length', String(sizeBytes));
    res.setHeader('Content-Disposition', `attachment; filename="${id}.webm"`);
    stream.pipe(res);
  }

  @Get('recordings/:id/download-url')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_DOWNLOAD)
  @ApiOperation({ summary: 'Generar URL temporal firmada de descarga (no permanente)' })
  getDownloadUrl(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.createSignedUrl(user, id);
  }

  @Put('recordings/:id/preserve')
  @Permissions(PERMISSIONS.VIDEO_EVIDENCE_PRESERVE)
  @ApiOperation({ summary: 'Conservar grabación como evidencia (sin expiración)' })
  preserveEvidence(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @Request() req: ExpressRequest,
  ) {
    return this.videoService.preserveEvidence(user, id, body?.reason ?? '', extractContext(req));
  }

  @Put('recordings/:id/assign-incident')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Asociar grabación a incidencia' })
  assignIncident(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { incidentId: string },
    @Request() req: ExpressRequest,
  ) {
    return this.videoService.assignIncident(user, id, body.incidentId, extractContext(req));
  }

  @Put('recordings/:id/delete')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_DELETE)
  @ApiOperation({ summary: 'Eliminar grabación antes de la expiración' })
  deleteRecording(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: ExpressRequest,
  ) {
    return this.videoService.deleteRecording(user, id, extractContext(req));
  }
}

@ApiTags('Video')
@Public()
@UseGuards(JwtAuthGuard)
@Controller('video')
export class VideoPublicDownloadController {
  constructor(private readonly videoService: VideoService) {}

  @Get('download/:token')
  @ApiOperation({ summary: 'Descargar mediante URL temporal firmada (sin sesión)' })
  async downloadSigned(
    @Param('token') token: string,
    @Res() res: Response,
    @Request() req: ExpressRequest,
  ) {
    const { stream, sizeBytes, rec } = await this.videoService.consumeSignedUrl(token, { ip: req.ip, device: (req.headers['user-agent'] as string) || undefined });
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Length', String(sizeBytes));
    res.setHeader('Content-Disposition', `attachment; filename="${rec.id}.webm"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    stream.pipe(res);
  }
}