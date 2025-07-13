import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Job } from '../jobs/entities/job.entity';
import { Company } from '../jobs/entities/company.entity';
import { Location } from '../jobs/entities/location.entity';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST') || 'localhost',
  port: parseInt(configService.get('DATABASE_PORT') || '5432'),
  username: configService.get('DATABASE_USERNAME') || 'postgres',
  password: configService.get('DATABASE_PASSWORD') || 'password',
  database: configService.get('DATABASE_NAME') || 'job_server',
  entities: [Job, Company, Location],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});
