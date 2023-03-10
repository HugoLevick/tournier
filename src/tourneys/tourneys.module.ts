import { Module } from '@nestjs/common';
import { TourneysService } from './tourneys.service';
import { TourneysController } from './tourneys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourney } from './entities/tourney.entity';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TourneySignUps } from 'src/tourneys/entities/tourney-sign-ups.entity';
import { TourneyInvites } from './entities/tourney-invites.entity';
import { TourneysWsGateway } from '../tourneys-ws/tourneys-ws.gateway';
import { AlertsWsModule } from '../alerts-ws/alerts-ws.module';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TourneyTeams } from './entities/tourney-teams.entity';
import { TourneySignUpsController } from './tourney-sign-ups.controller';
import { TourneySignUpsService } from './tourney-sign-ups.service';

@Module({
  controllers: [TourneysController, TourneySignUpsController],
  providers: [
    TourneysService,
    AuthService,
    TourneysWsGateway,
    NotificationsService,
    TourneySignUpsService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Tourney,
      TourneySignUps,
      TourneyInvites,
      TourneyTeams,
    ]),
    AuthModule,
    ConfigModule,
    AlertsWsModule,
    NotificationsModule,
  ],
  exports: [TypeOrmModule, TourneysWsGateway],
})
export class TourneysModule {}
