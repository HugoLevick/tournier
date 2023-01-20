import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTourneyDto } from './dto/create-tourney.dto';
import { UpdateTourneyDto } from './dto/update-tourney.dto';
import { Tourney } from './entities/tourney.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { User, UserRoles } from 'src/auth/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { TourneyPersonDto } from './dto/tourney-person.dto';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { TwitchBodyRequest } from '../auth/interfaces/twitch-body-request.interface';
import { TourneysToUsers } from './entities/tourneys_people_users.entity';

@Injectable()
export class TourneysService {
  constructor(
    @InjectRepository(Tourney)
    private readonly tourneyRepository: Repository<Tourney>,
    @InjectRepository(TourneysToUsers)
    private readonly tourneyToUsersRepository: Repository<TourneysToUsers>,
    private readonly configService: ConfigService,
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
        .leftJoinAndSelect('Tourney.people', 'people')
        .leftJoinAndSelect('people.user', 'userId')
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

  async addPerson(term: string, user: User, tier: number = 0) {
    const tourney = await this.findOne(term);

    if (tourney.people.find((playerInfo) => playerInfo.user.id === user.id))
      throw new BadRequestException('Player is already in tourney');

    const relation = this.tourneyToUsersRepository.create({
      user,
      tourney,
      tier,
    });

    try {
      await this.tourneyToUsersRepository.save(relation);
      return {
        statusCode: 200,
        message: 'ok',
      };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  //! Not optimized since it queries tourneyrepository again
  async addPersonAdmin(
    term: string,
    tourneyPersonDto: TourneyPersonDto,
    owner: User,
  ) {
    const { twitchUsername } = tourneyPersonDto;
    const tourney = await this.findOne(term);

    if (!this.isTourneyOwnerOrPrivileged(tourney, owner))
      throw new UnauthorizedException(
        'Tourney does not belong to ' + owner.twitchUsername,
      );

    let user = await this.authService.findOne(twitchUsername);

    if (!user) {
      // Get own token
      var body: TwitchBodyRequest = {
        client_id: this.configService.get('TWITCH_CLIENT_ID'),
        client_secret: this.configService.get('TWITCH_SECRET'),
        grant_type: 'client_credentials',
      };

      const encodedBody = this.authService.encodeBody(body);
      const { access_token: token } = await this.authService.getTwitchTokenData(
        encodedBody,
      );

      const { data: userData } = await this.authService.getUserData(
        null,
        token,
        twitchUsername,
      );

      if (userData.length !== 1)
        throw new NotFoundException(`Twitch user ${twitchUsername} not found`);

      user = await this.authService.register({
        twitchId: userData[0].id,
        twitchUsername: userData[0].login,
        twitchProfileImageUrl: userData[0].profile_image_url,
      });
    }

    return this.addPerson(term, user);
  }

  async removePerson(term: string, user: User) {
    const tourney = await this.findOne(term);

    const userIndex = tourney.people.findIndex(
      (playerInfo) => playerInfo.user.id === user.id,
    );

    if (!userIndex) throw new NotFoundException('User is not in the tourney');

    tourney.people.splice(userIndex, 1);

    try {
      await this.tourneyRepository.manager.save(tourney);
      return {
        statusCode: 200,
        message: 'ok',
      };
    } catch (error) {
      this.handleDBError(error);
    }
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
