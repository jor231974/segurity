import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

const MAX_CHUNK_BYTES = 25 * 1024 * 1024;

@Injectable()
export class VideoStorageService {
  private readonly logger = new Logger('VideoStorage');
  private readonly root: string;
  private readonly uploadsDir: string;
  private readonly recordingsDir: string;

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('VIDEO_STORAGE_PATH', './storage/videos');
    this.root = path.resolve(process.cwd(), configured);
    this.uploadsDir = path.join(this.root, 'uploads');
    this.recordingsDir = path.join(this.root, 'recordings');
    this.ensureDirs();
  }

  private ensureDirs() {
    for (const dir of [this.root, this.uploadsDir, this.recordingsDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  private uploadPath(streamId: string): string {
    return path.join(this.uploadsDir, `${streamId}.webm.part`);
  }

  private recordingPath(streamId: string): string {
    return path.join(this.recordingsDir, `${streamId}.webm`);
  }

  private safeResolve(filePath: string): string {
    const resolved = path.resolve(this.root, filePath);
    if (!resolved.startsWith(this.root + path.sep)) {
      throw new NotFoundException('Ruta de archivo inválida');
    }
    return resolved;
  }

  async appendChunk(streamId: string, data: Buffer): Promise<number> {
    const file = this.uploadPath(streamId);
    const handle = await fsp.open(file, 'a');
    try {
      await handle.write(data);
    } finally {
      await handle.close();
    }
    const stat = await fsp.stat(file);
    if (stat.size > MAX_CHUNK_BYTES * 2) {
      await fsp.rm(file, { force: true }).catch(() => undefined);
      throw new Error('Chunk buffer excede el límite seguro');
    }
    return stat.size;
  }

  async discardUpload(streamId: string): Promise<void> {
    await fsp.rm(this.uploadPath(streamId), { force: true }).catch(() => undefined);
  }

  async finalize(streamId: string): Promise<{ finalPath: string; sizeBytes: number }> {
    const temp = this.uploadPath(streamId);
    if (!fs.existsSync(temp)) {
      return { finalPath: this.recordingPath(streamId), sizeBytes: 0 };
    }
    const sizeBytes = (await fsp.stat(temp)).size;
    if (sizeBytes === 0) {
      await fsp.rm(temp, { force: true }).catch(() => undefined);
      return { finalPath: this.recordingPath(streamId), sizeBytes: 0 };
    }
    const finalPath = this.recordingPath(streamId);
    await fsp.rename(temp, finalPath).catch(async (err) => {
      if (err.code === 'EEXIST' || err.code === 'EPERM') {
        await fsp.copyFile(temp, finalPath).catch(() => undefined);
        await fsp.rm(temp, { force: true }).catch(() => undefined);
      } else {
        throw err;
      }
    });
    return { finalPath, sizeBytes };
  }

  getRecordingStream(filePath: string) {
    const absolute = this.safeResolve(filePath);
    if (!fs.existsSync(absolute)) {
      throw new NotFoundException('Archivo de video no disponible');
    }
    return fs.createReadStream(absolute);
  }

  getRecordingStats(filePath: string): { sizeBytes: number } {
    const absolute = this.safeResolve(filePath);
    if (!fs.existsSync(absolute)) return { sizeBytes: 0 };
    return { sizeBytes: fs.statSync(absolute).size };
  }

  async deleteRecording(filePath: string): Promise<void> {
    try {
      const absolute = this.safeResolve(filePath);
      await fsp.rm(absolute, { force: true });
    } catch (err) {
      this.logger.warn(`No se pudo eliminar archivo ${filePath}: ${err.message}`);
    }
  }
}