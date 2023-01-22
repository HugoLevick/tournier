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
  Put,
} from '@nestjs/common';
import { TourneysService } from './tourneys.service';
import { CreateTourneyDto } from './dto/create-tourney.dto';
import { UpdateTourneyDto } from './dto/update-tourney.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User, UserRoles } from 'src/auth/entities/user.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { TourneyPersonDto } from './dto/tourney-person.dto';
import { TourneySignUpDto } from './dto/tourney-signup.dto';
import { InviteResponseDto } from './dto/invite-response.dto';

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
  @Post(':term/signup')
  addPerson(
    @Param('term') term: string,
    @Body() tourneySignUpDto: TourneySignUpDto,
    @GetUser() user: User,
  ) {
    return this.tourneysService.signUp(term, tourneySignUpDto, user);
  }

  @Auth(UserRoles.admin, UserRoles.creator)
  @Post(':term/signup-admin')
  addPersonAdmin(
    @Param('term') term: string,
    @GetUser() user: User,
    @Body() tourneySignUpDto: TourneySignUpDto,
  ) {
    return this.tourneysService.signUpAdmin(term, tourneySignUpDto, user);
  }

  @Auth()
  @Delete(':term/signout')
  signOut(@Param('term') term: string, @GetUser() user: User) {
    return this.tourneysService.signOut(term, user);
  }

  @Auth()
  @Delete(':term/signout-admin')
  removePersonAdmin(
    @Param('term') term: string,
    @GetUser() user: User,
    @Body() tourneyPersonDto: TourneyPersonDto,
  ) {
    return this.tourneysService.signOutAdmin(term, user, tourneyPersonDto);
  }

  @Auth()
  @Put(':term/invite')
  inviteResponse(
    @Body() inviteResponseDto: InviteResponseDto,
    @GetUser() user: User,
  ) {
    return this.tourneysService.inviteResponse(inviteResponseDto, user);
  }
}
