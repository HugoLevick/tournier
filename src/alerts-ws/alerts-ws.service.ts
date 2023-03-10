import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';

interface ConnectedClients {
  [username: string]: {
    sockets: UserSocket;
    user: User;
  };
}

interface UserSocket {
  [id: string]: Socket;
}

@Injectable()
export class AlertsWsService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  private connectedClients: ConnectedClients = {};

  async registerClient(client: Socket, payload: JwtPayload) {
    const newSockets: UserSocket = {};
    const connectedClient = this.connectedClients[payload.username];

    if (connectedClient) {
      if (Object.keys(connectedClient.sockets).length > 1)
        throw new Error(
          `Client '${payload.username}' connected on too many sessions`,
        );
      for (const socket in connectedClient.sockets) {
        newSockets[socket] = connectedClient.sockets[socket];
      }
    }

    newSockets[client.id] = client;

    const user = await this.userRepository
      .createQueryBuilder()
      .select(['User', 'User.isActive'])
      .where('User.id=:id', { id: payload.id })
      .getOne();

    if (!user || !user.isActive) {
      throw new Error(`User '${payload.username}' not found on alerts-ws`);
    }

    this.connectedClients[user.username] = { sockets: newSockets, user };
    console.log('connected', Object.keys(this.connectedClients).length);
    console.log(
      `${payload.username} connected on ${
        Object.keys(newSockets).length
      } sessions`,
    );
  }

  removeClient(client: Socket, username: string) {
    const connectedClientSockets =
      this.connectedClients[username]?.sockets || {};
    if (Object.keys(connectedClientSockets).length > 1) {
      delete this.connectedClients[username].sockets[client.id];
    } else {
      delete this.connectedClients[username];
    }
    console.log('disconnected', Object.keys(this.connectedClients).length);
  }

  getConnectedClient(username: string) {
    return this.connectedClients[username];
  }
}
