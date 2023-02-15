import { User } from '../../auth/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { TourneySignUps } from 'src/tourneys/entities/tourney-sign-ups.entity';
import { TourneyTeams } from './tourney-teams.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TourneyStatus {
  pending = 'PENDING',
  inProgress = 'INPROGRESS',
  ended = 'ENDED',
  canceled = 'CANCELED',
}

@Entity('tourneys')
export class Tourney {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    nullable: false,
  })
  name: string;

  @Column('text', {
    nullable: false,
    unique: true,
  })
  slug?: string;

  @Column('text', {
    nullable: true,
    default: 'No description',
  })
  description?: string;

  @Column('int', {
    nullable: false,
    default: 1,
  })
  peoplePerTeam: number;

  @Column('bool', {
    nullable: false,
    default: false,
  })
  tiered: boolean;

  @Column('timestamp', {
    nullable: false,
  })
  startTime: string;

  @Column('bool', {
    nullable: false,
    default: false,
  })
  allowCheckIns: boolean;

  @Column('enum', {
    nullable: false,
    enum: TourneyStatus,
    default: TourneyStatus.pending,
  })
  status: TourneyStatus;

  @Column('bool', {
    nullable: false,
    default: true,
    select: false,
  })
  isActive: boolean;

  @Column('float', {
    nullable: false,
    default: 0,
  })
  prize: number;

  @ManyToOne(() => User, (user) => user.tourneysHosted, {
    nullable: false,
    eager: true,
  })
  creator: User;

  @OneToMany(() => TourneySignUps, (signUp) => signUp.tourney, {
    cascade: true,
  })
  signUps: TourneySignUps[];

  @OneToMany(() => TourneyTeams, (team) => team.tourney, {
    cascade: true,
  })
  teams: TourneyTeams[];

  @BeforeInsert()
  @BeforeUpdate()
  editTourneyOnUpdate() {
    this.slug = this.slugify(this.name);
    let dtoStartTime = new Date(this.startTime);

    dtoStartTime.setSeconds(0, 0);

    this.startTime = dtoStartTime.toISOString();
  }

  private slugify(string: string) {
    return string.toLocaleLowerCase().replace(/[ ']/gi, '_');
  }
}
