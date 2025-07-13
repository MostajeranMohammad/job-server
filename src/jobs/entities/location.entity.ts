import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from 'typeorm';
import { Job } from './job.entity';

@Entity()
@Unique(['city', 'state'])
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @OneToMany(() => Job, (job) => job.location)
  jobs: Job[];
}
