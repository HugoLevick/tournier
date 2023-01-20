import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  twitchUsername: string;

  @IsString()
  twitchId: string;

  @IsString()
  twitchProfileImageUrl: string;
}
