import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user-dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    try {
      const { password, ...userData } = registerUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      delete user.password;
      delete user.id;

      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  //TODO: Only admins can update roles, twitchusername, isactive
  async update(id: string, updateUserDto: UpdateUserDto) {
    let { password, ...userData } = updateUserDto;
    if (password) password = bcrypt.hashSync(password, 10);

    const user = await this.userRepository.preload({
      id,
      ...userData,
      password,
    });

    try {
      await this.userRepository.save(user);
      delete user.password;
      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async remove(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user || !user.isActive)
      throw new NotFoundException(`User with id '${id}' was not found`);

    await this.update(id, { isActive: false });
    return {
      status: 200,
      message: 'OK',
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      select: { id: true, email: true, password: true },
    });

    if (!user) throw new NotFoundException('No account registered');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid');

    const token = this.getJwtToken({ id: user.id });
    delete user.id;
    return {
      email,
      token,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    throw new InternalServerErrorException('Unexpected error');
  }
}
