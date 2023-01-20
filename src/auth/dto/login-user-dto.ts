import { IsOptional, IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  code: string;
}
