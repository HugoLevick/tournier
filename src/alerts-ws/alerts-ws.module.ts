import { Module } from '@nestjs/common';
import { AlertsWsService } from './alerts-ws.service';
import { AlertsWsGateway } from './alerts-ws.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [AlertsWsGateway, AlertsWsService],
  imports: [AuthModule],
  exports: [AlertsWsGateway, AlertsWsService],
})
export class AlertsWsModule {}
