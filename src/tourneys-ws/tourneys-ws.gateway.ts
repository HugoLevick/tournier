import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnGatewayDisconnect } from '@nestjs/websockets/interfaces';
import { Server, Socket } from 'socket.io';
import { TourneySignUps } from '../tourneys/entities/tourney-sign-ups.entity';
import { TourneyInvites } from '../tourneys/entities/tourney-invites.entity';
import { User } from 'src/auth/entities/user.entity';
import { AlertsWsGateway } from '../alerts-ws/alerts-ws.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { TourneyTeams } from '../tourneys/entities/tourney-teams.entity';

@WebSocketGateway({ namespace: '/tourneys' })
export class TourneysWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly alertsWsGateway: AlertsWsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  @WebSocketServer() public wss: Server;

  handleConnection(client: Socket) {
    //this.tourneysWsService.registerClient(client);
  }
  handleDisconnect(client: Socket) {
    //this.tourneysWsService.removeClient(client.id);
  }

  emitSignUp(tourneyId: string, team: TourneySignUps) {
    this.wss.emit(`sign-up-t-${tourneyId}`, team);
  }

  emitSignOut(tourneyId: string, team: TourneySignUps) {
    this.wss.emit(`sign-out-t-${tourneyId}`, team);
  }

  emitInviteAccept(
    tourneyId: string,
    user: User,
    invite: TourneyInvites,
    verifiedInvites?: boolean,
  ) {
    this.wss.emit(`inv-update-t-${tourneyId}`, invite);
  }

  async emitInviteDeny(team: TourneySignUps) {
    for (const member of team.members) {
      this.alertsWsGateway.sendAlert(
        member.username,
        'A member denied an invite',
        team,
      );
      await this.notificationsService.create(member, {
        message: `Someone in ${team.captain.username}'s team denied an invite to a tourney`,
        json: JSON.stringify({
          type: 'deny-invite',
          tourney: { title: team.tourney.name, slug: team.tourney.slug },
        }),
      });
    }
  }

  async emitRandomTeams(tourneyId: string, randomTeams: any[]) {
    this.wss.emit(`random-t-${tourneyId}`, randomTeams);
  }

  async emitCheckInsToggle(tourneyId: string, allowCheckIns: boolean) {
    this.wss.emit(`toggle-check-t-${tourneyId}`, allowCheckIns);
  }

  emitSignUpUpdate(tourneyId: string, signUp: TourneySignUps) {
    this.wss.emit(`signUp-update-t-${tourneyId}`, signUp);
  }
}
