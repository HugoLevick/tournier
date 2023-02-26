import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as tmi from 'tmi.js';
import { Repository } from 'typeorm';
import { Tourney } from '../tourneys/entities/tourney.entity';

@Injectable()
export class TmiService {
  private logger = new Logger('TmiService');
  private tmiClient: tmi.Client;

  constructor(
    @InjectRepository(Tourney)
    private readonly tourneyRepository: Repository<Tourney>,
  ) {
    this.startBot();
  }

  async startBot(bottedChannels: string[] = []) {
    const getCreatorsQuery = this.tourneyRepository.createQueryBuilder();
    const creatorUsers = await getCreatorsQuery
      .select('Tourney.creatorId')
      .where("Tourney.status != 'CANCELED' AND Tourney.isActive=true")
      .leftJoinAndSelect('Tourney.creator', 'creator')
      .distinct(true)
      .execute();

    for (const creator of creatorUsers) {
      bottedChannels.push(creator.creator_username);
    }
    const options = {
      options: {
        //debug: true,
        joinInterval: 300,
      },
      identity: {
        username: process.env.BOT_USERNAME,
        password: process.env.OAUTH_TWITCH,
      },
      channels: bottedChannels,
    };

    this.tmiClient = tmi.Client(options);

    this.tmiClient.on('connected', () => {
      this.logger.log(`Connected to Twitch`);

      this.logger.log(
        `Connecting to ${options.channels.length} Twitch channels...`,
      );
    });

    this.tmiClient.on('connecting', () => {
      this.logger.log('Connecting to Twitch...');
    });

    this.tmiClient.on('disconnected', () => {
      this.logger.error('Disconnected from Twitch');
    });

    this.tmiClient.on('join', (channel) => {
      this.logger.log('Listening to ' + channel);
    });

    this.tmiClient.on('message', (channel, tags, message, self) => {
      // Ignore echoed messages
      if (self) return;

      if (message.startsWith('!')) {
        // "@alca, heya!"
        this.tmiClient.say(channel, `@${tags.username}, command ${message}`);
      }
    });

    try {
      await this.tmiClient.connect();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
