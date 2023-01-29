import { Module } from '@nestjs/common';
import { TourneysWsGateway } from './tourneys-ws.gateway';
import { AlertsWsModule } from '../alerts-ws/alerts-ws.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';
import { TourneysService } from '../tourneys/tourneys.service';
import { TourneysModule } from '../tourneys/tourneys.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
  providers: [
    TourneysWsGateway,
    NotificationsService,
    TourneysService,
    AuthService,
  ],
  exports: [TourneysWsGateway],
  imports: [AlertsWsModule, NotificationsModule, TourneysModule, AuthModule],
})
export class TourneysWsModule {}
