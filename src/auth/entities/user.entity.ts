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
    this.email = this.email.toLowerCase();
  }
}
