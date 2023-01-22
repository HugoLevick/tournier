import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import axios, { AxiosResponse } from 'axios';
import { UnauthorizedException } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { TwitchBodyRequest } from '../auth/interfaces/twitch-body-request.interface';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
  ) {}

  async findOne(term: string) {
    const findOneQuery = this.userRepository.createQueryBuilder();

    return await findOneQuery
      .where('User.twitchId=:term OR User.twitchUsername=:term', { term })
      .getOne();
  }

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

  async login(loginUserDto: LoginUserDto) {
    let email: string,
      twitchUsername: string,
      twitchId: string,
      twitchProfileImageUrl: string;
    const { code } = loginUserDto;

    const body: TwitchBodyRequest = {
      client_id: this.configService.get('TWITCH_CLIENT_ID'),
      client_secret: this.configService.get('TWITCH_SECRET'),
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${this.configService.get('HOST')}${this.configService.get(
        'REDIRECT_URI',
      )}`,
    };

    //* Get own token
    // body = {
    //   client_id: this.configService.get('TWITCH_CLIENT_ID'),
    //   client_secret: this.configService.get('TWITCH_SECRET'),
    //   grant_type: 'client_credentials',
    // };

    //Encode body
    const encodedBody = this.encodeBody(body);

    const tokenData = await this.getTwitchTokenData(encodedBody);

    if (!tokenData) throw new UnauthorizedException('Authentication denied');

    const token: string = tokenData.access_token;

    const validateData = await this.getValidateData(token);

    twitchUsername = validateData.login;
    twitchId = validateData.user_id;

    const userFetchData = await this.getUserData(twitchId, token);

    let userData: any;

    if (!userFetchData.data[0]) {
      throw new BadRequestException('User not found on twitch');
    } else userData = userFetchData.data[0];

    email = userData.email;

    twitchProfileImageUrl = userData.profile_image_url;

    if (!twitchId) {
      this.logger.error('Couldnt find twitch id');
      throw new InternalServerErrorException('Something unexpected happened');
    }

    let user: User;
    user = await this.userRepository.findOne({
      where: { twitchId, isActive: true },
      select: { id: true, email: true, twitchProfileImageUrl: true },
    });

    if (!user)
      user = await this.register({
        email,
        twitchUsername,
        twitchId,
        twitchProfileImageUrl,
      });

    if (user.twitchProfileImageUrl !== twitchProfileImageUrl) {
      await this.update(user.id, { twitchProfileImageUrl });
    }

    if (user.twitchUsername !== twitchUsername) {
      await this.update(user.id, { twitchUsername });
    }

    if (!user.email && email) {
      await this.update(user.id, { email });
    } else if (!user.email && !email) {
      throw new UnauthorizedException('User not registered');
    }

    if (code)
      return {
        token: this.getJwToken({ id: user.id }),
      };
    else return {};
  }

  async findOneTwitchAndRegister(twitchUsername: string) {
    //* Get own token
    const body = {
      client_id: this.configService.get('TWITCH_CLIENT_ID'),
      client_secret: this.configService.get('TWITCH_SECRET'),
      grant_type: 'client_credentials',
    };

    //Encode body
    const encodedBody = this.encodeBody(body);

    const tokenData = await this.getTwitchTokenData(encodedBody);
    if (!tokenData)
      throw new UnauthorizedException('Twitch authentication denied');
    const token: string = tokenData.access_token;

    const userFetchData = await this.getUserData(
      undefined,
      token,
      twitchUsername,
    );

    let userData: any;

    if (!userFetchData.data[0]) {
      throw new BadRequestException(
        `User '${twitchUsername}' not found on twitch`,
      );
    } else userData = userFetchData.data[0];

    const twitchId = userData.id;
    const twitchProfileImageUrl = userData.profile_image_url;

    return this.register({ twitchId, twitchUsername, twitchProfileImageUrl });
  }
  //TODO: Only admins can update roles, twitchusername, isactive
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    try {
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  //TODO: auth
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

  encodeBody(body: TwitchBodyRequest): string {
    let formBody = [];
    for (let property in body) {
      let encodedKey = encodeURIComponent(property);
      let encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + '=' + encodedValue);
    }
    return formBody.join('&');
  }

  async getTwitchTokenData(encodedBody: string) {
    try {
      //Fetch Access Token
      const { data: tokenData } = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        encodedBody,
      );
      return tokenData;
    } catch (error) {
      this.commonService.handleAxiosError(error);
    }
  }

  async getValidateData(token: string) {
    try {
      const { data: validateData } = await axios.get(
        'https://id.twitch.tv/oauth2/validate',
        {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        },
      );
      return validateData;
    } catch (error) {
      this.commonService.handleAxiosError(error);
    }
  }

  async getUserData(twitchId: string, token: string, twitchUsername?: string) {
    try {
      let userFetchData: AxiosResponse;
      if (twitchId) {
        //Fetch user email
        userFetchData = await axios.get(
          'https://api.twitch.tv/helix/users?id=' + twitchId,
          {
            headers: {
              Authorization: 'Bearer ' + token,
              'Client-Id': this.configService.get('TWITCH_CLIENT_ID'),
            },
          },
        );
      } else if (twitchUsername) {
        userFetchData = await axios.get(
          'https://api.twitch.tv/helix/users?login=' + twitchUsername,
          {
            headers: {
              Authorization: 'Bearer ' + token,
              'Client-Id': this.configService.get('TWITCH_CLIENT_ID'),
            },
          },
        );
      }

      return userFetchData.data;
    } catch (error) {
      this.commonService.handleAxiosError(error);
    }
  }

  private getJwToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    throw new InternalServerErrorException('Unexpected error');
  }
}
