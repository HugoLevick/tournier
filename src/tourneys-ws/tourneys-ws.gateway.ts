import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnGatewayDisconnect } from '@nestjs/websockets/interfaces';
import { Server, Socket } from 'socket.io';
import { TourneysTeams } from '../tourneys/entities/tourneys_teams.entity';

@WebSocketGateway({ namespace: '/tourneys' })
export class TourneysWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() public wss: Server;

  handleConnection(client: Socket) {
    //this.tourneysWsService.registerClient(client);
  }
  handleDisconnect(client: Socket) {
    //this.tourneysWsService.removeClient(client.id);
  }

  emitSignUp(tourneyId: string, team: TourneysTeams) {
    this.wss.emit(`sign-up-t-${tourneyId}`, team);
  }

  emitSignOut(tourneyId: string, team: TourneysTeams) {
    this.wss.emit(`sign-out-t-${tourneyId}`, team);
  }
}
