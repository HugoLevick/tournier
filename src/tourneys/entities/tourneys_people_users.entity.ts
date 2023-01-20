import { User } from 'src/auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tourney } from './tourney.entity';

@Entity()
export class TourneysToUsers {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('numeric', {
    nullable: true,
    default: 0,
  })
  tier: number;

  @ManyToOne(() => Tourney, (tourney) => tourney.people, { eager: false })
  tourney: Tourney;

  @ManyToOne(() => User, (user) => user.tourneysJoined, { eager: true })
  user: User;
}
