import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JobTransformationService } from './job-transformation.service';
import { JobManagerService } from './job-manager.service';
import { JobSource1Response } from '../models/job-source-1';
import { JobSource2Response } from '../models/job-source-2';

@Injectable()
export class JobSyncService {
  private readonly logger = new Logger(JobSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly transformationService: JobTransformationService,
    private readonly jobManagerService: JobManagerService,
  ) {
    this.manualSync().catch((error) =>
      this.logger.error('Manual sync failed', error),
    );
  }

  @Cron(process.env.CRON_SCHEDULE || CronExpression.EVERY_HOUR)
  async syncJobs() {
    this.logger.log('Starting job synchronization...');

    try {
      // Fetch from both sources concurrently
      const [source1Jobs, source2Jobs] = await Promise.all([
        this.fetchAndTransformSource1(),
        this.fetchAndTransformSource2(),
      ]);

      // Combine all jobs
      const allJobs = [...source1Jobs, ...source2Jobs];

      // Save to database
      await this.jobManagerService.createJobs(allJobs);
    } catch (error) {
      this.logger.error('Error during job synchronization:', error);
    }
  }

  private async fetchAndTransformSource1() {
    try {
      const response = await firstValueFrom(
        this.httpService.get<JobSource1Response>(
          'https://assignment.devotel.io/api/provider1/jobs',
        ),
      );

      const transformedJobs = this.transformationService.transformSource1Jobs(
        response.data,
      );

      this.logger.log(`Fetched ${transformedJobs.length} jobs from source 1`);
      return transformedJobs;
    } catch (error) {
      this.logger.error('Error fetching from source 1:', error);
      return [];
    }
  }

  private async fetchAndTransformSource2() {
    try {
      const response = await firstValueFrom(
        this.httpService.get<JobSource2Response>(
          'https://assignment.devotel.io/api/provider2/jobs',
        ),
      );

      const transformedJobs = this.transformationService.transformSource2Jobs(
        response.data,
      );

      this.logger.log(`Fetched ${transformedJobs.length} jobs from source 2`);
      return transformedJobs;
    } catch (error) {
      this.logger.error('Error fetching from source 2:', error);
      return [];
    }
  }

  // Manual trigger for testing
  async manualSync() {
    await this.syncJobs();
  }
}
