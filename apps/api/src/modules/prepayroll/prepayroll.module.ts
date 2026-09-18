import { Module } from '@nestjs/common';
import { PrepayrollController } from './prepayroll.controller';
import { PrepayrollService } from './prepayroll.service';
@Module({ controllers: [PrepayrollController], providers: [PrepayrollService], exports: [PrepayrollService] })
export class PrepayrollModule {}