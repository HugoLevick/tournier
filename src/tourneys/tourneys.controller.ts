import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TourneysService } from './tourneys.service';
import { CreateTourneyDto } from './dto/create-tourney.dto';
import { UpdateTourneyDto } from './dto/update-tourney.dto';

@Controller('tourneys')
export class TourneysController {
  constructor(private readonly tourneysService: TourneysService) {}

  @Post()
  create(@Body() createTourneyDto: CreateTourneyDto) {
    return this.tourneysService.create(createTourneyDto);
  }

  @Get()
  findAll() {
    return this.tourneysService.findAll();
  }

  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.tourneysService.findOne(term);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTourneyDto: UpdateTourneyDto,
  ) {
    return this.tourneysService.update(id, updateTourneyDto);
  }

  @Delete(':term')
  remove(@Param('term') term: string) {
    return this.tourneysService.remove(term);
  }
}
