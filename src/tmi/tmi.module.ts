import { Module } from '@nestjs/common';
import { TmiService } from './tmi.service';
import { TourneysModule } from '../tourneys/tourneys.module';

@Module({
  providers: [TmiService],
  imports: [TourneysModule],
})
export class TmiModule {}
