import { Module } from '@nestjs/common';
import { VideoController, VideoPublicDownloadController } from './video.controller';
import { VideoService } from './video.service';
import { VideoStorageService } from './video-storage.service';

@Module({
  controllers: [VideoController, VideoPublicDownloadController],
  providers: [VideoService, VideoStorageService],
  exports: [VideoService],
})
export class VideoModule {}