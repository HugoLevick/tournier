import { IsString } from 'class-validator';

export class TourneyPersonDto {
  @IsString()
  twitchUsername: string;
}
