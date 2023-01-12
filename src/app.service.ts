import { Injectable } from '@nestjs/common';
import { TmiService } from './tmi/tmi.service';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Tournier is coming soon! Contact: tournierbot@gmail.com';
  }
}
