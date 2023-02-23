import { IsNumber, Min } from 'class-validator';

export class UpdateTierDto {
  @IsNumber()
  @Min(0)
  tier: number;
}
