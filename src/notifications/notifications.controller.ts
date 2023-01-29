import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Auth()
  @Get()
  findAll(@GetUser() user: User) {
    return this.notificationsService.findAll(user);
  }

  @Auth()
  @Patch(':id')
  acknowledge(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.notificationsService.acknowledge(id, user);
  }
}
