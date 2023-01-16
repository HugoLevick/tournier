import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Tournier is coming soon! Contact: tournierbot@gmail.com';
  }
}
