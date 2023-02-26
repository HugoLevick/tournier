import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  code?: string;

  @MinLength(4)
  @MaxLength(30)
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(64)
  @IsOptional()
  password: string;
}
