import { Module } from '@nestjs/common';
import { TourneysWsGateway } from './tourneys-ws.gateway';

@Module({
  providers: [TourneysWsGateway],
})
export class TourneysWsModule {}
