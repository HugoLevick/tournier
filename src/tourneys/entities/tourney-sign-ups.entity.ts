import { User } from 'src/auth/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Tourney } from './tourney.entity';
import { TourneyInvites } from './tourney-invites.entity';

@Entity()
export class TourneySignUps {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('numeric', {
    nullable: false,
    default: 0,
  })
  tier: number;

  @ManyToOne(() => User, (user) => user.teamCaptain, {
    eager: true,
    nullable: false,
  })
  captain: User;

  @Column('bool', {
    nullable: false,
    default: false,
  })
  isCheckedIn: boolean;

  @Column('bool', {
    nullable: false,
    default: false,
  })
  verifiedInvites: boolean;

  @OneToMany(() => TourneyInvites, (invite) => invite.fromTeam, {
    cascade: true,
  })
  invited: TourneyInvites[];

  @ManyToMany(() => User, (user) => user.tourneysJoined, { eager: true })
  @JoinTable()
  members: User[];

  @ManyToOne(() => Tourney, (tourney) => tourney.signUps, { eager: false })
  tourney: Tourney;
}
