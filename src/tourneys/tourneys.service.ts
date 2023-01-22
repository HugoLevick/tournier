import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTourneyDto } from './dto/create-tourney.dto';
import { UpdateTourneyDto } from './dto/update-tourney.dto';
import { Tourney } from './entities/tourney.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { User, UserRoles } from 'src/auth/entities/user.entity';
import { TourneyPersonDto } from './dto/tourney-person.dto';
import { AuthService } from '../auth/auth.service';
import { TourneysTeams } from 'src/tourneys/entities/tourneys_teams.entity';
import { TourneySignUpDto } from './dto/tourney-signup.dto';
import { TourneyInvites } from './entities/tourney-invites.entity';
import { InviteResponseDto } from './dto/invite-response.dto';

@Injectable()
export class TourneysService {
  constructor(
    @InjectRepository(Tourney)
    private readonly tourneyRepository: Repository<Tourney>,
    @InjectRepository(TourneysTeams)
    private readonly tourneysTeamsRepository: Repository<TourneysTeams>,
    @InjectRepository(TourneyInvites)
    private readonly tourneyInvitesRepository: Repository<TourneyInvites>,
    private readonly authService: AuthService,
  ) {}

  async create(createTourneyDto: CreateTourneyDto, user: User) {
    const tourney = this.tourneyRepository.create(createTourneyDto);

    try {
      tourney.creator = user;
      await this.tourneyRepository.save(tourney);
      delete tourney.creator.role;
      delete tourney.creator.isActive;
      delete tourney.creator.email;
      delete tourney.isActive;
      return tourney;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, offset } = paginationDto;
    return await this.tourneyRepository.find({
      take: limit,
      skip: offset,
      where: { isActive: true },
    });
  }

  async findOne(term: string) {
    let tourney: Tourney;
    const queryBuilder = this.tourneyRepository.createQueryBuilder();

    queryBuilder.select('Tourney');

    try {
      if (this.checkIfValidUUID(term))
        queryBuilder.where('Tourney.id=:term', { term });
      else queryBuilder.where('Tourney.slug=:term', { term });

      tourney = await queryBuilder
        .leftJoinAndSelect('Tourney.creator', 'creator')
        .leftJoinAndSelect('Tourney.signUps', 'signUps')
        .leftJoinAndSelect('signUps.captain', 'captain')
        .leftJoinAndSelect('signUps.members', 'members')
        .getOne();
    } catch (error) {
      this.handleDBError(error);
    }
    if (!tourney)
      throw new NotFoundException(
        `Tourney with identifier '${term}' was not found`,
      );

    return tourney;
  }

  async update(id: string, updateTourneyDto: UpdateTourneyDto, user: User) {
    let tourney = await this.findOne(id);

    if (!tourney)
      throw new NotFoundException(`Tourney with id ${id} was not found`);

    if (!(tourney.creator.id === user.id) && !this.isPrivileged(user)) {
      throw new ForbiddenException(
        `Tourney '${id}' does not belong to ${user.twitchUsername}`,
      );
    }

    try {
      await this.tourneyRepository.update(id, updateTourneyDto);
      return { ...tourney, ...updateTourneyDto };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async remove(term: string, user: User) {
    const queryBuilder = this.tourneyRepository.createQueryBuilder();

    const tourney = await queryBuilder
      .where(
        'Tourney.id = :id OR Tourney.slug = :slug AND Tourney.isActive = true',
        {
          id: this.checkIfValidUUID(term) ? term : null,
          slug: term,
        },
      )
      .select(['Tourney', 'Tourney.isActive'])
      .leftJoinAndSelect('Tourney.creator', 'creator')
      .getOne();

    if (!tourney)
      throw new NotFoundException(
        `Tourney with identifier '${term}' not found`,
      );

    if (tourney.creator.id !== user.id && !this.isPrivileged(user))
      throw new ForbiddenException(
        `Tourney '${term}' does not belong to ${user.twitchUsername}`,
      );

    tourney.isActive = false;
    tourney.name = tourney.id;

    try {
      const response = await this.tourneyRepository.update(tourney.id, tourney);
      if (response.affected < 1)
        throw new InternalServerErrorException('Something unexpected happened');

      return {
        statusCode: '200',
        message: 'ok',
      };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async signUp(
    term: string,
    tourneySignUpDto: TourneySignUpDto,
    user: User,
    tier: number = 0,
    tourney?: Tourney,
  ) {
    if (!tourney) tourney = await this.findOne(term);

    if (tourneySignUpDto.members.length !== tourney.peoplePerTeam - 1)
      throw new BadRequestException(
        `Team has to have ${tourney.peoplePerTeam} members including the person signing up`,
      );

    const checkInTourneyTeamQB =
      this.tourneysTeamsRepository.createQueryBuilder();

    const inTeams = await checkInTourneyTeamQB
      .select(['TourneysTeams'])
      .leftJoinAndSelect('TourneysTeams.members', 'Members')
      .where(
        'TourneysTeams.tourneyId=:tourneyId AND TourneysTeams.verifiedInvites=true AND Members.twitchUsername IN(:...members)',
        {
          tourneyId: tourney.id,
          members: [user.twitchUsername, ...tourneySignUpDto.members],
        },
      )
      .getRawMany();

    if (inTeams.length !== 0)
      throw new BadRequestException(
        `Player ${inTeams[0].Members_twitchUsername} is already in a team`,
      );

    const invitedPeopleQB = this.tourneyInvitesRepository.createQueryBuilder();

    if (tourney.peoplePerTeam > 1) {
      const invitedPeople = await invitedPeopleQB
        .leftJoinAndSelect('TourneyInvites.toUser', 'toUser')
        .leftJoinAndSelect('TourneyInvites.fromTeam', 'fromTeam')
        .leftJoinAndSelect('fromTeam.captain', 'teamCaptain')
        .where(
          'teamCaptain.id=:userId AND toUser.twitchUsername IN(:...members)',
          {
            userId: user.id,
            members: tourneySignUpDto.members,
          },
        )
        .getMany();

      if (invitedPeople.length !== 0) {
        throw new BadRequestException(
          `Player '${invitedPeople[0].toUser.twitchUsername}' already has a pending invite from you`,
        );
      }
    }

    delete user.role;
    delete user.isActive;
    delete user.email;
    delete user.twitchId;

    let members: User[] = [user];

    const toDo = [];
    for (const member of tourneySignUpDto.members) {
      toDo.push(
        new Promise(async (resolve, reject) => {
          let currentMember = await this.authService.findOne(member);
          if (currentMember) members.push(currentMember);
          else {
            try {
              currentMember = await this.authService.findOneTwitchAndRegister(
                member,
              );
              delete currentMember.role;
              delete currentMember.isActive;
              delete currentMember.email;
              delete currentMember.twitchId;
              members.push(currentMember);
            } catch (error) {
              reject(error);
            }
          }

          resolve(currentMember);
        }),
      );
    }

    await Promise.all(toDo).catch((error) => {
      throw error;
    });

    const team = this.tourneysTeamsRepository.create({
      tier,
      members,
      tourney,
      captain: user,
      invited: [],
      verifiedInvites: tourney.peoplePerTeam === 1 ? true : false,
    });

    for (const member of members) {
      if (member.id !== user.id)
        team.invited.push(
          this.tourneyInvitesRepository.create({
            toUser: member,
          }),
        );
    }

    try {
      await this.tourneysTeamsRepository.save(team);

      return team;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async signUpAdmin(
    term: string,
    tourneySignUpDto: TourneySignUpDto,
    owner: User,
    tier: number = 0,
  ) {
    const tourney = await this.findOne(term);
    if (!this.isTourneyOwnerOrPrivileged(tourney, owner))
      throw new UnauthorizedException(
        'Tourney does not belong to ' + owner.twitchUsername,
      );

    if (tourneySignUpDto.members.length !== tourney.peoplePerTeam)
      throw new BadRequestException(
        `Team members array has to have a length of ${tourney.peoplePerTeam}`,
      );

    const [captainUsername] = tourneySignUpDto.members.splice(0, 1);

    let captain = await this.authService.findOne(captainUsername);
    if (!captain)
      captain = await this.authService.findOneTwitchAndRegister(
        captainUsername,
      );

    return this.signUp(term, tourneySignUpDto, captain, tier);
  }

  async signOut(term: string, user: User, tourney?: Tourney) {
    if (!tourney) tourney = await this.findOne(term);

    const tourneyTeamsQB = this.tourneysTeamsRepository.createQueryBuilder();

    const team = await tourneyTeamsQB
      .leftJoinAndSelect('TourneysTeams.members', 'Members')
      .where(
        'TourneysTeams.tourneyId=:tourneyId AND TourneysTeams.verifiedInvites=true AND Members.twitchUsername=:username',
        {
          tourneyId: tourney.id,
          username: user.twitchUsername,
        },
      )
      .getOne();

    if (!team)
      throw new NotFoundException(
        `Player '${user.twitchUsername}' was not in a team`,
      );

    try {
      const response = await this.tourneysTeamsRepository.delete({
        id: team.id,
      });
      if (response.affected < 1)
        throw new InternalServerErrorException(
          'Something unexpected happened when deleting team',
        );
      return {
        statusCode: 200,
        message: 'ok',
      };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async signOutAdmin(
    term: string,
    user: User,
    tourneyPersonDto: TourneyPersonDto,
  ) {
    const tourney = await this.findOne(term);

    if (!this.isTourneyOwnerOrPrivileged(tourney, user))
      throw new UnauthorizedException(
        `User ${user.twitchUsername} is not owner or admin`,
      );

    const person = await this.authService.findOne(
      tourneyPersonDto.twitchUsername,
    );
    if (!person)
      throw new NotFoundException(
        `Player ${tourneyPersonDto.twitchUsername} is not registered`,
      );

    return this.signOut(undefined, person, tourney);
  }

  //! Could have some optimization to not query database that much
  async inviteResponse(inviteResponseDto: InviteResponseDto, user: User) {
    const tourneyInvitesQB = this.tourneyInvitesRepository.createQueryBuilder();

    const invite = await tourneyInvitesQB
      .leftJoinAndSelect('TourneyInvites.toUser', 'toUser')
      .leftJoinAndSelect('TourneyInvites.fromTeam', 'fromTeam')
      .where('TourneyInvites.id=:id', {
        id: inviteResponseDto.inviteId,
      })
      .getOne();

    if (!invite)
      throw new NotFoundException(
        'Invite not found, maybe someone else rejected it',
      );

    if (invite.toUser.id !== user.id && !this.isPrivileged(user))
      throw new UnauthorizedException();

    if (!inviteResponseDto.accepted) {
      if (!invite.fromTeam.id)
        throw new InternalServerErrorException(
          'Could not deny invite, something unexpected happened',
        );

      try {
        await this.tourneysTeamsRepository.delete({ id: invite.fromTeam.id });
        return {
          statusCode: 200,
          message: 'ok',
        };
      } catch (error) {
        this.handleDBError(error);
      }
    }

    if (invite.accepted)
      throw new BadRequestException('Invite already accepted');

    await this.tourneyInvitesRepository.update(inviteResponseDto.inviteId, {
      accepted: inviteResponseDto.accepted,
    });

    const [{ invited: teamInvites }] = await this.tourneysTeamsRepository.find({
      where: { id: invite.fromTeam.id },
      relations: { invited: true },
      take: 1,
    });

    let verifiedInvites = true;
    for (const invite of teamInvites) {
      if (!invite.accepted) {
        verifiedInvites = false;
        break;
      }
    }

    if (verifiedInvites)
      this.tourneysTeamsRepository.update(invite.fromTeam.id, {
        verifiedInvites,
      });

    return {
      statusCode: 200,
      message: 'ok',
    };
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

  private isPrivileged(user: User) {
    if (user.role === UserRoles.admin || user.role === UserRoles.owner)
      return true;
    else return false;
  }

  private isTourneyOwnerOrPrivileged(tourney: Tourney, user: User) {
    if (tourney.creator.twitchId === user.twitchId || this.isPrivileged(user))
      return true;
    else return false;
  }

  private checkIfValidUUID(str: string) {
    // Regular expression to check if string is a valid UUID
    const regexExp =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

    return regexExp.test(str);
  }
}
