import { IsJSON, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsJSON()
  @IsOptional()
  json?: Object;
}
