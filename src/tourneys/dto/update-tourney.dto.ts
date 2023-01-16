import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { CreateTourneyDto } from './create-tourney.dto';
import { TourneyStatus } from '../entities/tourney.entity';

let statuses = [];
for (const status of Object.keys(TourneyStatus)) {
  statuses.push(TourneyStatus[status]);
}
export class UpdateTourneyDto extends PartialType(CreateTourneyDto) {
  @IsIn(statuses)
  @IsOptional()
  status?: TourneyStatus;
}
