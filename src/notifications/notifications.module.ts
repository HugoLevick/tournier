import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { TourneysService } from '../tourneys/tourneys.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { AlertsWsModule } from '../alerts-ws/alerts-ws.module';
import { TourneysModule } from '../tourneys/tourneys.module';
import { TourneysWsGateway } from '../tourneys-ws/tourneys-ws.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    TourneysService,
    TourneysWsGateway,
    AuthService,
  ],
  imports: [
    AuthModule,
    AlertsWsModule,
    forwardRef(() => TourneysModule),
    TypeOrmModule.forFeature([Notification]),
  ],
  exports: [TypeOrmModule],
})
export class NotificationsModule {}
