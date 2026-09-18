import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

const MAX_FRAGMENT_BYTES = 25 * 1024 * 1024;
const MAX_STREAM_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Capa de almacenamiento de objetos del módulo video.
 *
 * La grabación en vivo se divide en fragmentos (objetos) independientes y el
 * archivo final se arma concatenándolos en orden. Esto evita depender de un
 * único archivo enorme en memoria y permite reintentos por fragmento.
 *
 * Driver actual: disco local (VIDEO_STORAGE_PATH). La interfaz está pensada
 * para añadir un driver S3-compatible (Amazon S3, Cloudflare R2, MinIO)
 * sin tocar el resto del módulo: implementar las primitivas de objetos
 * (putFragment/getFragmentStream/listFragments/concatToRecording/
 * deleteObject/existsObject) contra el bucket y seleccionar el driver
 * mediante OBJECT_STORAGE_DRIVER=s3.
 */
@Injectable()
export class VideoStorageService {
  private readonly logger = new Logger('VideoStorage');
  private readonly root: string;
  private readonly liveDir: string;
  private readonly recordingsDir: string;

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('VIDEO_STORAGE_PATH', './storage/videos');
    this.root = path.resolve(process.cwd(), configured);
    this.liveDir = path.join(this.root, 'live');
    this.recordingsDir = path.join(this.root, 'recordings');
    this.ensureDirs();
  }

  private ensureDirs() {
    for (const dir of [this.root, this.liveDir, this.recordingsDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  private safeResolve(base: string, key: string): string {
    const resolved = path.resolve(base, key);
    if (!resolved.startsWith(base + path.sep)) {
      throw new NotFoundException('Ruta de archivo inválida');
    }
    return resolved;
  }

  private fragmentKey(streamId: string, seq: number): string {
    return `live/${streamId}/${String(seq).padStart(6, '0')}.webm`;
  }

  private fragmentAbs(streamId: string, seq: number): string {
    return this.safeResolve(this.liveDir, `${streamId}/${String(seq).padStart(6, '0')}.webm`);
  }

  private recordingAbs(filePath: string): string {
    return this.safeResolve(this.recordingsDir, filePath);
  }

  async putFragment(streamId: string, seq: number, data: Buffer): Promise<{ objectKey: string; sizeBytes: number }> {
    if (!data || data.length === 0) throw new Error('Fragmento vacío');
    if (data.length > MAX_FRAGMENT_BYTES) throw new Error('Fragmento demasiado grande');
    const dir = path.dirname(this.fragmentAbs(streamId, 0));
    await fsp.mkdir(dir, { recursive: true });
    const file = this.fragmentAbs(streamId, seq);
    if (fs.existsSync(file) && (await fsp.stat(file)).size === data.length) {
      return { objectKey: this.fragmentKey(streamId, seq), sizeBytes: data.length };
    }
    await fsp.writeFile(file, data);
    const total = await this.totalLiveBytes(streamId);
    if (total > MAX_STREAM_BYTES) {
      await fsp.rm(file, { force: true }).catch(() => undefined);
      throw new Error('La transmisión excede el límite máximo de almacenamiento');
    }
    return { objectKey: this.fragmentKey(streamId, seq), sizeBytes: data.length };
  }

  async totalLiveBytes(streamId: string): Promise<number> {
    const dir = path.dirname(this.fragmentAbs(streamId, 0));
    if (!fs.existsSync(dir)) return 0;
    const files = await fsp.readdir(dir);
    let total = 0;
    for (const f of files) {
      try {
        total += (await fsp.stat(path.join(dir, f))).size;
      } catch {}
    }
    return total;
  }

  async listFragments(streamId: string): Promise<Array<{ seq: number; sizeBytes: number }>> {
    const dir = path.dirname(this.fragmentAbs(streamId, 0));
    if (!fs.existsSync(dir)) return [];
    const files = (await fsp.readdir(dir)).filter((f) => f.endsWith('.webm'));
    const result: Array<{ seq: number; sizeBytes: number }> = [];
    for (const f of files) {
      const seq = parseInt(f.replace('.webm', ''), 10);
      if (Number.isFinite(seq)) {
        try {
          result.push({ seq, sizeBytes: (await fsp.stat(path.join(dir, f))).size });
        } catch {}
      }
    }
    return result.sort((a, b) => a.seq - b.seq);
  }

  getFragmentStream(streamId: string, seq: number): fs.ReadStream {
    const file = this.fragmentAbs(streamId, seq);
    if (!fs.existsSync(file)) {
      throw new NotFoundException('Fragmento no disponible');
    }
    return fs.createReadStream(file);
  }

  getFragmentSize(streamId: string, seq: number): number {
    const file = this.fragmentAbs(streamId, seq);
    if (!fs.existsSync(file)) return 0;
    return fs.statSync(file).size;
  }

  /**
   * Concatenar los fragmentos a un solo archivo de grabación WebM.
   * MediaRecorder con timeslice genera fragmentos cuyos timestamps son
   * contiguos, por lo que la concatenación byte a byte produce un WebM válido.
   */
  async concatToRecording(streamId: string, recordingId: string, filePath: string, fragmentCount: number): Promise<number> {
    const dir = path.dirname(this.fragmentAbs(streamId, 0));
    const out = this.recordingAbs(filePath);
    await fsp.mkdir(path.dirname(out), { recursive: true });
    const tmpOut = out + '.tmp';
    await fsp.rm(tmpOut, { force: true }).catch(() => undefined);

    const handle = await fsp.open(tmpOut, 'w');
    let totalBytes = 0;
    try {
      for (let seq = 0; seq < fragmentCount; seq++) {
        const src = path.join(dir, `${String(seq).padStart(6, '0')}.webm`);
        if (!fs.existsSync(src)) continue;
        const data = await fsp.readFile(src);
        await handle.write(data);
        totalBytes += data.length;
      }
    } finally {
      await handle.close();
    }
    if (totalBytes > 0) {
      await fsp.rename(tmpOut, out).catch(async (err) => {
        if (err.code === 'EEXIST' || err.code === 'EPERM') {
          await fsp.copyFile(tmpOut, out).catch(() => undefined);
          await fsp.rm(tmpOut, { force: true }).catch(() => undefined);
        } else {
          await fsp.rm(tmpOut, { force: true }).catch(() => undefined);
          throw err;
        }
      });
    } else {
      await fsp.rm(tmpOut, { force: true }).catch(() => undefined);
    }
    return totalBytes;
  }

  async discardLive(streamId: string): Promise<void> {
    await fsp.rm(path.dirname(this.fragmentAbs(streamId, 0)), { recursive: true, force: true }).catch(() => undefined);
  }

  getRecordingStream(filePath: string): fs.ReadStream {
    const absolute = this.recordingAbs(filePath);
    if (!fs.existsSync(absolute)) {
      throw new NotFoundException('Archivo de video no disponible');
    }
    return fs.createReadStream(absolute);
  }

  getRecordingStats(filePath: string): { sizeBytes: number } {
    const absolute = this.recordingAbs(filePath);
    if (!fs.existsSync(absolute)) return { sizeBytes: 0 };
    return { sizeBytes: fs.statSync(absolute).size };
  }

  async deleteRecording(filePath: string): Promise<void> {
    try {
      const absolute = this.recordingAbs(filePath);
      await fsp.rm(absolute, { force: true });
    } catch (err) {
      this.logger.warn(`No se pudo eliminar archivo ${filePath}: ${(err as Error).message}`);
    }
  }
}