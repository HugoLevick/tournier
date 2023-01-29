import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { TourneysService } from '../tourneys/tourneys.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @Inject(forwardRef(() => TourneysService))
    private readonly tourneysService: TourneysService,
  ) {}

  async findAll(user: User) {
    const warnings = await this.notificationsRepository
      .createQueryBuilder()
      .where(
        'Notification.toUserId=:userId AND Notification.acknowledged=false',
        {
          userId: user.id,
        },
      )
      .getMany();

    const notifications = {
      invites: await this.tourneysService.getInvites(user),
      warnings,
    };

    return notifications;
  }

  async acknowledge(id: number, user: User) {
    const notification = await this.notificationsRepository.findOne({
      relations: {
        toUser: true,
      },
      where: { id },
    });

    if (notification.toUser.id !== user.id) throw new UnauthorizedException();

    try {
      notification.acknowledged = true;
      this.notificationsRepository.save(notification);
    } catch (error) {
      throw new InternalServerErrorException('notification error');
    }
  }

  async create(user: User, createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationsRepository.create({
      ...createNotificationDto,
      toUser: user,
    });
    return await this.notificationsRepository.save(notification);
  }
}
