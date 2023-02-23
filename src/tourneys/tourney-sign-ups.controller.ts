import { Body, Controller, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User, UserRoles } from 'src/auth/entities/user.entity';
import { UpdateTierDto } from './dto/update-tier.dto';
import { TourneySignUpsService } from './tourney-sign-ups.service';

@Controller('signups')
export class TourneySignUpsController {
  constructor(private readonly tourneySignUpsService: TourneySignUpsService) {}
  @Auth(UserRoles.creator, UserRoles.admin)
  @Patch(':signUpId')
  updateTier(
    @Param('signUpId', ParseIntPipe) signUpId: number,
    @Body() updateTierDto: UpdateTierDto,
    @GetUser() user: User,
  ) {
    return this.tourneySignUpsService.updateTier(
      signUpId,
      updateTierDto.tier,
      user,
    );
  }

  @Auth()
  @Patch(':signUpId/checkin')
  checkIn(
    @Param('signUpId', ParseIntPipe) signUpId: number,
    @GetUser() user: User,
  ) {
    return this.tourneySignUpsService.checkIn(signUpId, user);
  }
}
