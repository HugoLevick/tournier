import { Module } from '@nestjs/common';
import { TmiService } from './tmi.service';

@Module({
  providers: [TmiService],
  exports: [],
})
export class TmiModule {}
