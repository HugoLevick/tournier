import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRoles } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { TourneySignUps } from './entities/tourney-sign-ups.entity';
import { TourneysService } from './tourneys.service';
import { TourneysWsGateway } from '../tourneys-ws/tourneys-ws.gateway';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TourneySignUpsService {
  constructor(
    @InjectRepository(TourneySignUps)
    private readonly tourneySignUpsRepository: Repository<TourneySignUps>,
    private readonly tourneysService: TourneysService,
    private readonly tourneysWsGateway: TourneysWsGateway,
  ) {}

  async findOne(id: number) {
    const signUp = await this.tourneySignUpsRepository.findOne({
      where: { id },
      relations: { tourney: true, captain: true, members: true, invited: true },
    });
    if (!signUp) throw new NotFoundException('Registration not found');
    return signUp;
  }

  async updateTier(signUpId: number, tier: number, user: User) {
    const signUp = await this.findOne(signUpId);
    const tourney = { ...signUp.tourney };
    delete signUp.tourney;
    try {
      signUp.tier = tier;
      await this.tourneySignUpsRepository.save(signUp);
      this.tourneysWsGateway.emitSignUpUpdate(tourney.id, signUp);
      return {
        message: 'Tier updated!',
        status: 200,
      };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async checkIn(signUpId: number, user: User) {
    const signUp = await this.findOne(signUpId);
    const tourney = { ...signUp.tourney };
    delete signUp.tourney;

    if (tourney.creator.id !== user.id && !this.isPrivileged(user)) {
      if (!tourney.allowCheckIns)
        throw new BadRequestException('Tournament does not allow check ins');

      if (signUp.captain.id !== user.id)
        throw new UnauthorizedException('Only team captains can check in');

      if (!signUp.verifiedInvites)
        throw new BadRequestException(
          'Some players have not accepted their invites',
        );
    } else if (!signUp.verifiedInvites) {
      for (const invite of signUp.invited) {
        if (!invite.accepted) {
          await this.tourneysService.inviteResponse(
            { inviteId: invite.id, accepted: true },
            user,
          );

          invite.accepted = true;
        }
      }
      signUp.verifiedInvites = true;
    }

    signUp.isCheckedIn = !signUp.isCheckedIn;
    try {
      await this.tourneySignUpsRepository.save(signUp);
      this.tourneysWsGateway.emitSignUpUpdate(tourney.id, signUp);
      return {
        message: `${signUp.captain.twitchUsername} checked in!`,
        status: 200,
      };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  private isPrivileged(user: User) {
    if (user.role === UserRoles.admin || user.role === UserRoles.owner)
      return true;
    else return false;
  }
  private handleDBError(error: any) {
    if (error.code == '23505') throw new BadRequestException(error.detail);
    if (error.response?.statusCode === 400)
      throw new BadRequestException(error.response?.message);
    else {
      console.log(error);
      throw new InternalServerErrorException('Something unexpected happened');
    }
  }
}
