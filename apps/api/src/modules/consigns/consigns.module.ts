import { Module } from '@nestjs/common';
import { ConsignsController } from './consigns.controller';
import { ConsignsService } from './consigns.service';

@Module({
  controllers: [ConsignsController],
  providers: [ConsignsService],
  exports: [ConsignsService],
})
export class ConsignsModule {}