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

@Entity()
export class TourneyTeams {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.teamCaptain, {
    eager: true,
    nullable: false,
  })
  captain: User;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  members: User[];

  @ManyToOne(() => Tourney, (tourney) => tourney.teams, { eager: false })
  tourney: Tourney;
}
