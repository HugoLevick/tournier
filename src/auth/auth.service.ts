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
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user-dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { UnauthorizedException } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { TwitchBodyRequest } from '../auth/interfaces/twitch-body-request.interface';
import * as bcrypt from 'bcrypt';

interface PendingRegistration {
  [id: string]: { email: string; twitchId: string; twitchUsername: string };
}

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

  async search(term: string) {
    return this.userRepository.find({
      select: { id: false, username: true, profileImageUrl: true },
      where: { username: Like(`%${term}%`) },
      order: {
        username: 'ASC',
      },
    });
  }

  async findOne(term: string) {
    const findOneQuery = this.userRepository.createQueryBuilder();

    return await findOneQuery
      .where('User.twitchId=:term OR User.username=:term', {
        term: term.toLowerCase(),
      })
      .getOne();
  }

  async register(
    registerUserDto: RegisterUserDto,
    provider: string = 'tournier',
  ) {
    if (registerUserDto.username.match(/^[0-9]+$/))
      throw new BadRequestException('A username must have at least one letter');
    const username = registerUserDto.username.toLowerCase();
    let user: User;

    if (provider === 'tournier') {
      //Email registration

      //No use for twitch id, delete for security
      delete registerUserDto.twitchId;

      if (!registerUserDto.email || !registerUserDto.password)
        throw new BadRequestException('Email and password are required');
      const { password, email } = registerUserDto;

      user = this.userRepository.create({
        username,
        email,
        password: bcrypt.hashSync(password, 10),
      });
    } else if (provider === 'twitch') {
      //Twitch registration
      user = this.userRepository.create({
        ...registerUserDto,
        username,
      });
    }

    //Save user
    try {
      await this.userRepository.save(user);
      delete user.password;
      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    //Variables
    let twitchEmail: string,
      twitchId: string,
      profileImageUrl: string,
      twitchUsername: string,
      user: User;

    const { code } = loginUserDto;

    if (code) {
      //* Twitch Login
      const body: TwitchBodyRequest = {
        client_id: this.configService.get('TWITCH_CLIENT_ID'),
        client_secret: this.configService.get('TWITCH_SECRET'),
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${this.configService.get(
          'HOST',
        )}${this.configService.get('REDIRECT_URI')}`,
      };

      //* Get own token
      // body = {
      //   client_id: this.configService.get('TWITCH_CLIENT_ID'),
      //   client_secret: this.configService.get('TWITCH_SECRET'),
      //   grant_type: 'client_credentials',
      // };

      //Encode body in x-form-encode
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

      twitchEmail = userData.email;

      profileImageUrl = userData.profile_image_url;

      if (!twitchId) {
        this.logger.error('Couldnt find twitch id');
        throw new InternalServerErrorException('Something unexpected happened');
      }

      // if (this.userRepository.findBy({ username: twitchUsername })) {
      //   throw new BadRequestException();
      // }

      user = await this.userRepository.findOne({
        where: { twitchId, isActive: true },
        select: {
          id: true,
          email: true,
          profileImageUrl: true,
          username: true,
        },
      });

      let isNewRegistration = false;
      if (!user) {
        let username = twitchUsername;
        let isValidUsername = await this.verifyUsername(username);
        //Assign a valid username if twitch username isnt one
        let numberToAdd: number;
        while (!isValidUsername) {
          numberToAdd = (numberToAdd || 0) + 1;
          username = `${twitchUsername}_${numberToAdd}`;
          isValidUsername = await this.verifyUsername(username);
        }

        user = await this.register(
          {
            email: twitchEmail,
            username,
            twitchId,
            profileImageUrl,
            twitchUsername,
          },
          'twitch',
        );
        isNewRegistration = true;
      } else {
        if (user.profileImageUrl !== profileImageUrl) {
          await this.update(user.id, { profileImageUrl });
        }

        if (user.username !== twitchUsername) {
          await this.update(user.id, { twitchUsername });
        }

        if (twitchEmail && twitchEmail !== user.email) {
          await this.update(user.id, { email: twitchEmail });
        } else if (!user.email && !twitchEmail) {
          throw new UnauthorizedException(
            'User not registered, please log in to Tournier.xyz to register',
          );
        }
      }

      return {
        token: this.getJwToken({
          id: user.id,
          username: user.username,
        }),
        isNewRegistration,
      };
    } else {
      if (!loginUserDto.username || !loginUserDto.password)
        throw new BadRequestException(
          'A username and password are needed to login',
        );

      const { password } = loginUserDto;

      user = await this.userRepository.findOne({
        where: { username: loginUserDto.username, isActive: true },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
        },
      });

      if (!user || !bcrypt.compareSync(password, user.password ?? ''))
        throw new UnauthorizedException('Invalid username or password');

      const token = this.getJwToken({ id: user.id, username: user.username });
      return { token };
    }
  }

  async verifyUsername(username: string) {
    try {
      if (await this.findOne(username)) return false;
      else return true;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async findOneTwitchAndRegister(username: string) {
    username = username.toLowerCase();
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

    const userFetchData = await this.getUserData(undefined, token, username);

    let userData: any;

    if (!userFetchData.data[0]) {
      throw new BadRequestException(`User '${username}' not found on twitch`);
    } else userData = userFetchData.data[0];

    const twitchId = userData.id;
    const profileImageUrl = userData.profile_image_url;

    return this.register({ twitchId, username, profileImageUrl });
  }

  //TODO: Only admins can update roles, username, isactive
  async update(id: string, updateUserDto: UpdateUserDto) {
    const username = updateUserDto.username?.toLowerCase();
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
      username,
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
        {
          headers: {},
        },
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

  async getUserData(twitchId: string, token: string, username?: string) {
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
      } else if (username) {
        userFetchData = await axios.get(
          'https://api.twitch.tv/helix/users?login=' + username,
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
    if (error.code === '23505') {
      let errorString = error.detail.replace('Key (', '');
      errorString = errorString.replace(')=(', "'");
      errorString = errorString.replace(')', "'");
      errorString = errorString.replace(
        'already exists',
        'is already registered',
      );
      throw new BadRequestException(errorString);
    }

    console.log(error);

    throw new InternalServerErrorException('Unexpected error');
  }
}
