import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Logger } from '@nestjs/common';

@Injectable()
export class CommonService {
  handleAxiosError(error: AxiosError) {
    const logger = new Logger('AxiosError');

    logger.error(`${error.message}: ${error.config.data}`);
    if (error.code === 'ERR_BAD_REQUEST') throw new BadRequestException();

    throw new InternalServerErrorException(
      'Something unexpected with axios happened',
    );
  }
}
