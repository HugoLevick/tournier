import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  code: string;
}
