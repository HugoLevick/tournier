import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsNumber,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateTourneyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(10)
  peoplePerTeam: number;

  @IsBoolean()
  tiered: boolean;

  @IsDateString()
  startTime: string;

  @IsNumber()
  @Min(0)
  @Max(10000000)
  prize: number;
}
