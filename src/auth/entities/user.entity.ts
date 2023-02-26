import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TourneySignUps } from 'src/tourneys/entities/tourney-sign-ups.entity';
import { Tourney } from '../../tourneys/entities/tourney.entity';
import { TourneyInvites } from 'src/tourneys/entities/tourney-invites.entity';

export enum UserRoles {
  user = 'USER',
  creator = 'CREATOR',
  admin = 'ADMIN',
  owner = 'OWNER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    nullable: true,
    unique: true,
    select: false,
  })
  email: string;

  @Column('text', {
    nullable: true,
    select: false,
  })
  password: string;

  @Column('text', {
    nullable: false,
    unique: true,
  })
  username: string;

  @Column('text', {
    nullable: true,
    unique: true,
  })
  twitchUsername: string;

  @Column('text', {
    nullable: true,
    unique: true,
    select: false,
  })
  twitchId: string;

  @Column('text', {
    nullable: false,
    default:
      'https://static-cdn.jtvnw.net/user-default-pictures-uv/de130ab0-def7-11e9-b668-784f43822e80-profile_image-300x300.png',
  })
  profileImageUrl: string;

  @Column('enum', {
    enum: UserRoles,
    default: UserRoles.user,
    select: false,
  })
  role: UserRoles;

  @Column('bool', {
    default: true,
    select: false,
  })
  isActive: boolean;

  @OneToMany(() => Tourney, (tourney) => tourney.creator, {
    cascade: true,
  })
  tourneysHosted: Tourney[];

  @ManyToMany(() => TourneySignUps, (signUps) => signUps.members, {
    cascade: true,
  })
  tourneysJoined: TourneySignUps[];

  @OneToMany(() => TourneySignUps, (signUps) => signUps.captain)
  teamCaptain: TourneySignUps[];

  @OneToMany(() => TourneyInvites, (invite) => invite.toUser, {
    cascade: true,
  })
  incomingInvites: TourneyInvites[];

  @BeforeInsert()
  @BeforeUpdate()
  checkEmail() {
    if (this.email) this.email = this.email.toLowerCase();
  }
}
