import { User } from '../../auth/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { TourneySignUps } from 'src/tourneys/entities/tourney-sign-ups.entity';
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
    nullable: true,
  })
  startTime: string;

  @Column('timestamp', {
    nullable: true,
  })
  endTime: string;

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

  @OneToMany(() => TourneySignUps, (people) => people.tourney, {
    cascade: true,
  })
  signUps: TourneySignUps[];

  @BeforeInsert()
  @BeforeUpdate()
  editTourneyOnUpdate() {
    this.slug = this.slugify(this.name);
    let dtoStartTime = new Date(this.startTime);
    let dtoEndTime = new Date(this.endTime);

    dtoStartTime.setSeconds(0, 0);
    dtoEndTime.setSeconds(0, 0);

    if (dtoEndTime < dtoStartTime)
      throw new BadRequestException(
        'End time should not be greater than start time',
      );

    this.startTime = dtoStartTime.toISOString();
    this.endTime = dtoEndTime.toISOString();
  }

  private slugify(string: string) {
    return string.toLocaleLowerCase().replace(/[ ']/gi, '_');
  }
}
