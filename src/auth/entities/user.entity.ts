import { Tourney } from '../../tourneys/entities/tourney.entity';
import { TourneysToUsers } from '../../tourneys/entities/tourneys_people_users.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
    nullable: false,
    unique: true,
  })
  twitchUsername: string;

  @Column('text', {
    nullable: false,
    unique: true,
    select: false,
  })
  twitchId: string;

  @Column('text', {
    nullable: false,
    default:
      'https://static-cdn.jtvnw.net/user-default-pictures-uv/de130ab0-def7-11e9-b668-784f43822e80-profile_image-300x300.png',
  })
  twitchProfileImageUrl: string;

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

  @OneToMany(() => TourneysToUsers, (people) => people.user, {
    cascade: true,
  })
  tourneysJoined: TourneysToUsers[];

  @BeforeInsert()
  @BeforeUpdate()
  checkEmail() {
    if (this.email) this.email = this.email.toLowerCase();
  }
}
