import { IsOptional, IsString, MinLength } from 'class-validator';

export class TourneySignUpDto {
  @IsString({ each: true })
  @MinLength(4, { each: true })
  @IsOptional()
  members: string[] = [];
}
