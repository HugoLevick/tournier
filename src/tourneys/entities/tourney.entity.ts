import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm';

export enum TourneyStatus {
  pending = 'PENDING',
  inProgress = 'INPROGRESS',
  ended = 'ENDED',
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
  })
  isActive: boolean;

  @Column('float', {
    nullable: false,
    default: 0,
  })
  prize: number;

  @BeforeInsert()
  editTourneyOnCreate() {
    this.slug = this.slugify(this.name);
    let dtoStartTime = new Date(this.startTime);
    let dtoEndTime = new Date(this.endTime);

    dtoStartTime.setSeconds(0, 0);
    dtoEndTime.setSeconds(0, 0);

    this.startTime = dtoStartTime.toISOString();
    this.endTime = dtoEndTime.toISOString();
  }

  @BeforeUpdate()
  editTourneyOnUpdate() {
    this.slug = this.slugify(this.name);
    let dtoStartTime = new Date(this.startTime);
    let dtoEndTime = new Date(this.endTime);

    dtoStartTime.setSeconds(0, 0);
    dtoEndTime.setSeconds(0, 0);

    this.startTime = dtoStartTime.toISOString();
    this.endTime = dtoEndTime.toISOString();
  }

  private slugify(string: string) {
    return string.toLocaleLowerCase().replace(/[ ']/gi, '_');
  }
}
