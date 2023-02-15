import { IsInt, Max, Min } from 'class-validator';

export class RandomizeSignUpsDto {
  @IsInt()
  @Min(1)
  toFuseQuant: number;
}
