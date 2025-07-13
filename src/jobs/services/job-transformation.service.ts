import { Injectable } from '@nestjs/common';
import { Job } from '../entities/job.entity';
import { Company } from '../entities/company.entity';
import { Location } from '../entities/location.entity';
import { JobSource1, JobSource1Response } from '../models/job-source-1';
import { Source2JobEntry, JobSource2Response } from '../models/job-source-2';

@Injectable()
export class JobTransformationService {
  transformSource1Jobs(response: JobSource1Response): Job[] {
    return response.jobs.map((job) => this.transformSource1Job(job));
  }

  transformSource2Jobs(response: JobSource2Response): Job[] {
    const jobs: Job[] = [];
    Object.keys(response.data.jobsList).forEach((jobId) => {
      const jobData = response.data.jobsList[jobId];
      jobs.push(this.transformSource2Job(jobId, jobData));
    });
    return jobs;
  }

  private transformSource1Job(source: JobSource1): Job {
    const job = new Job();
    job.sourceId = source.jobId;
    job.title = source.title;
    job.type = source.details.type;
    job.skills = source.skills;
    job.postedDate = new Date(source.postedDate);
    job.remote = false; // Source 1 doesn't specify remote, default to false

    // Parse salary range
    const salaryInfo = this.parseSalaryRange(source.details.salaryRange);
    job.salaryMin = salaryInfo.min;
    job.salaryMax = salaryInfo.max;
    job.currency = salaryInfo.currency;

    // Create company
    job.company = new Company();
    job.company.name = source.company.name;
    job.company.industry = source.company.industry;

    // Parse location (without remote)
    job.location = this.parseLocationString(source.details.location);

    return job;
  }

  private transformSource2Job(jobId: string, source: Source2JobEntry): Job {
    const job = new Job();
    job.sourceId = jobId;
    job.title = source.position;
    job.salaryMin = source.compensation.min;
    job.salaryMax = source.compensation.max;
    job.currency = source.compensation.currency;
    job.experience = source.requirements.experience;
    job.skills = source.requirements.technologies;
    job.postedDate = new Date(source.datePosted);
    job.remote = source.location.remote; // Remote is now in Job entity

    // Create company
    job.company = new Company();
    job.company.name = source.employer.companyName;
    job.company.website = source.employer.website;

    // Create location (without remote)
    job.location = new Location();
    job.location.city = source.location.city;
    job.location.state = source.location.state;

    return job;
  }

  private parseSalaryRange(salaryRange: string): {
    min: number;
    max: number;
    currency: string;
  } {
    // Handle null/undefined values
    if (!salaryRange) {
      return { min: 0, max: 0, currency: '' };
    }

    // Parse format like "$62k - $136k" or "$90k - $130k"
    const match = salaryRange.match(/\$(\d+)k\s*-\s*\$(\d+)k/);
    if (match) {
      return {
        min: parseInt(match[1]) * 1000,
        max: parseInt(match[2]) * 1000,
        currency: 'USD',
      };
    }
    return { min: 0, max: 0, currency: '' };
  }

  private parseLocationString(locationStr: string): Location {
    // Parse format like "Seattle, WA"
    const location = new Location();
    const parts = locationStr.split(',').map((part) => part.trim());

    if (parts.length >= 2) {
      location.city = parts[0];
      location.state = parts[1];
    } else {
      location.city = locationStr;
    }

    return location;
  }
}
