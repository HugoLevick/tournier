import { PartialType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './create-user.dto';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { UserRoles } from '../entities/user.entity';

export class UpdateUserDto extends PartialType(RegisterUserDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  twitchUsername?: string;

  @IsIn(['USER', 'CREATOR', 'ADMIN'], { each: true })
  @IsOptional()
  roles?: UserRoles[];
}
