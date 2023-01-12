import { Module } from '@nestjs/common';
import { TourneysService } from './tourneys.service';
import { TourneysController } from './tourneys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourney } from './entities/tourney.entity';

@Module({
  controllers: [TourneysController],
  providers: [TourneysService],
  imports: [TypeOrmModule.forFeature([Tourney])],
})
export class TourneysModule {}
