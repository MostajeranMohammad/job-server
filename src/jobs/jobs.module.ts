import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { Job } from './entities/job.entity';
import { Company } from './entities/company.entity';
import { Location } from './entities/location.entity';
import { JobTransformationService } from './services/job-transformation.service';
import { JobManagerService } from './services/job-manager.service';
import { JobSyncService } from './services/job-sync.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Company, Location]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [JobsController],
  providers: [JobTransformationService, JobManagerService, JobSyncService],
})
export class JobsModule {}
