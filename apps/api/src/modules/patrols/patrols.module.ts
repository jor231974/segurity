import { Module } from '@nestjs/common';
import { PatrolsController } from './patrols.controller';
import { PatrolsService } from './patrols.service';

@Module({
  controllers: [PatrolsController],
  providers: [PatrolsService],
  exports: [PatrolsService],
})
export class PatrolsModule {}