import { User } from 'src/auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', {
    nullable: false,
  })
  message: string;

  @Column('bool', {
    nullable: false,
    default: false,
  })
  acknowledged: boolean;

  @Column('json', {
    nullable: true,
  })
  json: Object;

  @ManyToOne(() => User, {})
  toUser: User;
}
