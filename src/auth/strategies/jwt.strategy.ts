import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload) {
    const { id } = payload;

    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        twitchUsername: true,
        email: true,
        isActive: true,
        roles: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid token');

    if (!user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }
    return user;
  }
}
