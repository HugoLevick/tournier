import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user-dto';
import { Auth } from './decorators/auth.decorator';
import { UserRoles } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.update(id, updateUserDto);
  }

  @Auth(UserRoles.admin)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.remove(id);
  }
}
