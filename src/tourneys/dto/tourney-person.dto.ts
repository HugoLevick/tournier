import { IsString, MinLength } from 'class-validator';

export class TourneyPersonDto {
  @IsString()
  @MinLength(4)
  twitchUsername: string;
}
