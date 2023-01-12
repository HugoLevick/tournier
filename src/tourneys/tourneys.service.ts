import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTourneyDto } from './dto/create-tourney.dto';
import { UpdateTourneyDto } from './dto/update-tourney.dto';
import { Tourney } from './entities/tourney.entity';

@Injectable()
export class TourneysService {
  constructor(
    @InjectRepository(Tourney)
    private readonly tourneyRepository: Repository<Tourney>,
  ) {}

  async create(createTourneyDto: CreateTourneyDto) {
    const tourney = this.tourneyRepository.create(createTourneyDto);

    try {
      await this.tourneyRepository.save(tourney);
      return tourney;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async findAll() {
    return await this.tourneyRepository.find();
  }

  async findOne(term: string) {
    let tourney: Tourney;
    if (this.checkIfValidUUID(term))
      tourney = await this.tourneyRepository.findOneBy({ id: term });
    else tourney = await this.tourneyRepository.findOneBy({ slug: term });

    if (!tourney)
      throw new NotFoundException(
        `Tourney with identifier '${term}' was not found`,
      );

    return tourney;
  }

  async update(id: string, updateTourneyDto: UpdateTourneyDto) {
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

  async remove(term: string) {
    const tourney = await this.findOne(term);
    await this.tourneyRepository.remove(tourney);
    return {
      status: '200',
      message: 'ok',
    };
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
