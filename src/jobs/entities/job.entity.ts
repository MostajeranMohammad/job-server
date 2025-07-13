import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Company } from './company.entity';
import { Location } from './location.entity';

@Entity()
@Unique(['sourceId'])
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  sourceId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  salaryMin: number;

  @Column({ nullable: true })
  salaryMax: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  experience: number;

  @Column({ default: false })
  remote: boolean;

  @Column('simple-array', { nullable: true })
  skills: string[];

  @Column({ type: 'date', nullable: true })
  postedDate: Date;

  @ManyToOne(() => Company, (company) => company.jobs, {
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  company: Company;

  @ManyToOne(() => Location, (location) => location.jobs, {
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  location: Location;
}
