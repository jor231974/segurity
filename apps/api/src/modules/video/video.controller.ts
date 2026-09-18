import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe, Request, Res, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';
import type { Response } from 'express';

@ApiTags('Video')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('streams')
  @Permissions(PERMISSIONS.VIDEO_LIVE_VIEW)
  @ApiOperation({ summary: 'Listar transmisiones activas' })
  getActiveStreams(@CurrentUser() user: AuthUser) {
    return this.videoService.getActiveStreams(user);
  }

  @Post('streams')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiOperation({ summary: 'Iniciar transmisión WebRTC desde la app del guardia' })
  startStream(@CurrentUser() user: AuthUser, @Body() body: { latitude?: number; longitude?: number; serviceId?: string }) {
    return this.videoService.startStream(user, body || {});
  }

  @Put('streams/:id/end')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiOperation({ summary: 'Finalizar transmisión y crear grabación con expiración 48h' })
  endStream(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.endStream(user, id);
  }

  @Post('streams/:id/chunk')
  @Permissions(PERMISSIONS.VIDEO_LIVE_START)
  @ApiConsumes('application/octet-stream')
  @ApiOperation({ summary: 'Subir chunk de la grabación WebRTC mientras transmite' })
  saveChunk(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RawBodyRequest<Request>,
  ) {
    const body = req.body;
    const buffer = Buffer.isBuffer(body) ? body : req.rawBody ?? Buffer.from([]);
    return this.videoService.saveChunk(user, id, buffer);
  }

  @Get('recordings/:id/file')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_DOWNLOAD)
  @ApiOperation({ summary: 'Descargar/ver archivo de grabación (URL controlada)' })
  async getFile(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { stream, sizeBytes } = await this.videoService.getRecordingFile(user, id);
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Length', String(sizeBytes));
    res.setHeader('Content-Disposition', `attachment; filename="${id}.webm"`);
    stream.pipe(res);
  }

  @Get('recordings')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Listar grabaciones' })
  getRecordings(
    @CurrentUser() user: AuthUser,
    @Query('guardId') guardId?: string,
    @Query('incidentId') incidentId?: string,
    @Query('date') date?: string,
  ) {
    return this.videoService.getRecordings(user, { guardId, incidentId, date });
  }

  @Get('recordings/:id')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Obtener grabación' })
  getRecording(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.getRecording(user, id);
  }

  @Get('recordings/:id/download-url')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_DOWNLOAD)
  @ApiOperation({ summary: 'Obtener URL temporal de descarga' })
  getDownloadUrl(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.getDownloadUrl(user, id);
  }

  @Put('recordings/:id/assign-incident')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_VIEW)
  @ApiOperation({ summary: 'Asociar grabación a incidencia' })
  assignIncident(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { incidentId: string },
  ) {
    return this.videoService.assignIncident(user, id, body.incidentId);
  }

  @Put('recordings/:id/delete')
  @Permissions(PERMISSIONS.VIDEO_RECORDING_DELETE)
  @ApiOperation({ summary: 'Eliminar grabación antes de expiración' })
  deleteRecording(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.deleteRecording(user, id);
  }
}