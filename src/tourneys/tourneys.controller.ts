import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TourneysService } from './tourneys.service';
import { CreateTourneyDto } from './dto/create-tourney.dto';
import { UpdateTourneyDto } from './dto/update-tourney.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User, UserRoles } from 'src/auth/entities/user.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { TourneyPersonDto } from './dto/tourney-person.dto';

@Controller('tourneys')
export class TourneysController {
  constructor(private readonly tourneysService: TourneysService) {}

  @Auth(UserRoles.creator)
  @Post()
  create(@Body() createTourneyDto: CreateTourneyDto, @GetUser() user: User) {
    return this.tourneysService.create(createTourneyDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tourneysService.findAll(paginationDto);
  }

  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.tourneysService.findOne(term);
  }

  @Auth(UserRoles.creator)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTourneyDto: UpdateTourneyDto,
    @GetUser() user: User,
  ) {
    return this.tourneysService.update(id, updateTourneyDto, user);
  }

  @Auth()
  @Delete(':term')
  remove(@Param('term') term: string, @GetUser() user: User) {
    return this.tourneysService.remove(term, user);
  }

  @Auth()
  @Post(':term/people')
  addPerson(@Param('term') term: string, @GetUser() user: User) {
    return this.tourneysService.addPerson(term, user);
  }

  @Auth(UserRoles.admin, UserRoles.creator)
  @Post(':term/people-admin')
  addPersonAdmin(
    @Param('term') term: string,
    @GetUser() user: User,
    @Body() addPersonDto: TourneyPersonDto,
  ) {
    return this.tourneysService.addPersonAdmin(term, addPersonDto, user);
  }

  @Auth()
  @Delete()
  removePerson(@Param('term') term: string, @GetUser() user: User) {
    return this.tourneysService.removePerson(term, user);
  }

  @Auth()
  @Delete()
  removePersonAdmin(@Param('term') term: string, @GetUser() user: User) {
    return this.tourneysService.removePerson(term, user);
  }
}
