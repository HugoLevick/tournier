import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user-dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    try {
      const user = this.userRepository.create({
        ...registerUserDto,
      });

      await this.userRepository.save(user);

      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  //TODO: Only admins can update roles, twitchusername, isactive
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
    });

    try {
      await this.userRepository.save(user);
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
    let email: string, twitchUsername: string, twitchId: string;
    const { code } = loginUserDto;

    const body = {
      client_id: this.configService.get('TWITCH_CLIENT_ID'),
      client_secret: this.configService.get('TWITCH_SECRET'),
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${this.configService.get('HOST')}${this.configService.get(
        'REDIRECT_URI',
      )}`,
    };

    //Encode body
    let formBody = [];
    for (let property in body) {
      let encodedKey = encodeURIComponent(property);
      let encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + '=' + encodedValue);
    }
    const encodedBody = formBody.join('&');

    try {
      //Fetch Access Token
      const { data: tokenData } = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        encodedBody,
      );

      if (!tokenData) throw new UnauthorizedException('Authentication denied');

      const token = tokenData.access_token;

      //Fetch usename
      const { data: validateData } = await axios.get(
        'https://id.twitch.tv/oauth2/validate',
        {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        },
      );

      twitchUsername = validateData.login;
      twitchId = validateData.user_id;

      //Fetch user email
      const {
        data: { data: userData },
      } = await axios.get('https://api.twitch.tv/helix/users?id=' + twitchId, {
        headers: {
          Authorization: 'Bearer ' + token,
          'Client-Id': this.configService.get('TWITCH_CLIENT_ID'),
        },
      });

      email = userData[0].email;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Something went wrong on our side... Try again later or report it to tournierbot@gmail.com',
      );
    }
    let user: User;

    user = await this.userRepository.findOne({
      where: { email, isActive: true },
      select: { id: true, email: true },
    });

    if (!user) user = await this.register({ email, twitchUsername, twitchId });

    const token = this.getJwtToken({ id: user.id });

    return {
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
