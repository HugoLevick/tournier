import { Injectable, Logger } from '@nestjs/common';
import * as tmi from 'tmi.js';

@Injectable()
export class TmiService {
  private logger = new Logger('Tmi');

  constructor() {
    this.startBot();
  }

  private options = {
    //options: { debug: true },
    identity: {
      username: process.env.BOT_USERNAME,
      password: process.env.OAUTH_TWITCH,
    },
    channels: ['h_levick'],
  };

  private tmiClient = tmi.Client(this.options);

  async startBot() {
    this.tmiClient.on('connected', () => {
      this.logger.log(
        `Connected to ${this.options.channels.length} Twitch channels`,
      );
    });

    this.tmiClient.on('message', (channel, tags, message, self) => {
      // Ignore echoed messages.
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
