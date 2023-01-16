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

@Injectable()
export class TourneysService {
  constructor(
    @InjectRepository(Tourney)
    private readonly tourneyRepository: Repository<Tourney>,
  ) {}

  async create(createTourneyDto: CreateTourneyDto, user: User) {
    const tourney = this.tourneyRepository.create(createTourneyDto);

    try {
      tourney.creator = user;
      await this.tourneyRepository.save(tourney);
      delete tourney.creator.roles;
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
    try {
      if (this.checkIfValidUUID(term))
        tourney = await this.tourneyRepository.findOneBy({ id: term });
      else tourney = await this.tourneyRepository.findOneBy({ slug: term });
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
    const [tourneyInfo] = await this.tourneyRepository.find({
      where: { id },
      take: 1,
      select: {
        id: true,
        creator: {
          id: true,
        },
      },
    });

    if (
      !(tourneyInfo.creator.id === user.id) &&
      !user.roles.includes(UserRoles.admin)
    ) {
      throw new ForbiddenException(
        `Tourney '${id}' does not belong to ${user.username}`,
      );
    }

    const tourney = await this.tourneyRepository.preload({
      id,
      ...updateTourneyDto,
    });

    if (!tourney)
      throw new NotFoundException(`Tourney with id ${id} was not found`);

    try {
      await this.tourneyRepository.save(tourney);
      return tourney;
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

    if (tourney.creator.id !== user.id && !user.roles.includes(UserRoles.admin))
      throw new ForbiddenException(
        `Tourney '${term}' does not belong to ${user.username}`,
      );

    tourney.isActive = false;
    tourney.name = tourney.id;

    try {
      const response = await this.tourneyRepository.update(tourney.id, tourney);
      if (response.affected < 1)
        throw new InternalServerErrorException('Something unexpected happened');
      //
      return {
        statusCode: '200',
        message: 'ok',
      };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  private handleDBError(error: any) {
    if (error.code == '23505') throw new BadRequestException(error.detail);
    else {
      console.log(error);
      throw new InternalServerErrorException('Something unexpected happened');
    }
  }

  private checkIfValidUUID(str: string) {
    // Regular expression to check if string is a valid UUID
    const regexExp =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

    return regexExp.test(str);
  }
}
