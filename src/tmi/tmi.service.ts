import { Injectable } from '@nestjs/common';
import * as tmi from 'tmi.js';

@Injectable()
export class TmiService {
  constructor() {
    this.startBot();
  }

  private tmiClient = tmi.Client({
    //options: { debug: true },
    identity: {
      username: process.env.BOT_USERNAME,
      password: process.env.OAUTH_TWITCH,
    },
    channels: ['h_levick'],
  });

  async startBot() {
    try {
      await this.tmiClient.connect();
    } catch (error) {
      console.log(error);
    }

    this.tmiClient.on('connected', () => {
      console.log('hola');
    });

    this.tmiClient.on('message', (channel, tags, message, self) => {
      // Ignore echoed messages.
      if (self) return;

      if (message.toLowerCase() === '!hello') {
        // "@alca, heya!"
        this.tmiClient.say(channel, `@${tags.username}, heya!`);
      }
    });
  }
}
