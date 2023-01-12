import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTourneyDto } from './create-tourney.dto';

export class UpdateTourneyDto extends PartialType(CreateTourneyDto) {
  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
