import { User } from 'src/auth/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TourneySignUps } from './tourney-sign-ups.entity';

@Entity()
export class TourneyInvites {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.incomingInvites, {
    eager: true,
    nullable: false,
  })
  toUser: User;

  @ManyToOne(() => TourneySignUps, (team) => team.invited, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  fromTeam: TourneySignUps;

  @Column('bool', {
    nullable: true,
    default: null,
  })
  accepted: boolean;

  @Column('bool', {
    nullable: false,
    default: true,
    select: false,
  })
  isActive: boolean;
}
