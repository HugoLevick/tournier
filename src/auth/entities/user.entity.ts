import { Tourney } from '../../tourneys/entities/tourney.entity';
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
    nullable: false,
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
  })
  twitchId: string;

  @Column('text', {
    nullable: false,
    default:
      'https://static-cdn.jtvnw.net/user-default-pictures-uv/de130ab0-def7-11e9-b668-784f43822e80-profile_image-300x300.png',
  })
  twitchProfileImageUrl: string;

  @Column('text', {
    array: true,
    default: [UserRoles.user],
    select: false,
  })
  roles: UserRoles[];

  @Column('bool', {
    default: true,
    select: false,
  })
  isActive: boolean;

  @OneToMany(() => Tourney, (tourney) => tourney.creator, {
    cascade: true,
  })
  tourneysHosted?: Tourney[];

  @BeforeInsert()
  @BeforeUpdate()
  checkEmail() {
    if (this.email) this.email = this.email.toLowerCase();
  }
}
