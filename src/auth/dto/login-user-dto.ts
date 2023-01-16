import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MaxLength(50)
  password: string;
}
