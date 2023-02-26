import { WebSocketGateway, OnGatewayConnection } from '@nestjs/websockets';
import { AlertsWsService } from './alerts-ws.service';
import { OnGatewayDisconnect } from '@nestjs/websockets/interfaces';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets/decorators';

@WebSocketGateway({ namespace: '/alerts' })
export class AlertsWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly wss: Server;
  private readonly logger = new Logger('Alerts-Ws');
  constructor(
    private readonly alertsWsService: AlertsWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.alertsWsService.registerClient(client, payload);
    } catch (error) {
      this.logger.error(error);
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token, { ignoreExpiration: true });
    } catch (error) {
      console.log('Couldnt verifiy jwt at alerts-ws');
      this.logger.error(error);
    }

    if (!payload.username) {
      return;
    }

    this.alertsWsService.removeClient(client, payload.username);
  }

  sendAlert(username: string, message: string, data: any) {
    const client = this.alertsWsService.getConnectedClient(username);
    if (client) {
      for (const socket in client.sockets) {
        const currentSocket: Socket = client.sockets[socket];
        currentSocket.emit('notification', { message, data });
      }
    }
  }
}
