import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(30)
  username: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(64)
  password?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(30)
  @IsOptional()
  twitchUsername?: string;

  @IsString()
  @IsOptional()
  twitchId?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
