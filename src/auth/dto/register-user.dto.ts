import { IsEmail, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email: string;

  @IsString()
  twitchUsername: string;

  @IsString()
  twitchId: string;
}
