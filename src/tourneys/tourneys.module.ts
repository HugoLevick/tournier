import { Module } from '@nestjs/common';
import { TourneysService } from './tourneys.service';
import { TourneysController } from './tourneys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourney } from './entities/tourney.entity';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TourneysTeams } from 'src/tourneys/entities/tourneys_teams.entity';
import { TourneyInvites } from './entities/tourney-invites.entity';

@Module({
  controllers: [TourneysController],
  providers: [TourneysService, AuthService],
  imports: [
    TypeOrmModule.forFeature([Tourney, TourneysTeams, TourneyInvites]),
    AuthModule,
    ConfigModule,
  ],
  exports: [TypeOrmModule],
})
export class TourneysModule {}
