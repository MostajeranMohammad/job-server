import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { Company } from '../entities/company.entity';
import { Location } from '../entities/location.entity';
import { JobQueryDto } from '../dto/job-query.dto';

@Injectable()
export class JobManagerService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async createJobs(jobs: Job[]): Promise<void> {
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      await this.upsertJobs(job);
    }
  }

  private async upsertCompanies(comp: Company): Promise<Company> {
    const result = await this.companyRepository
      .createQueryBuilder()
      .insert()
      .into(Company)
      .values(comp)
      .orUpdate(['industry', 'website'], ['name'])
      .returning('*')
      .execute();

    // If insert/update happened, return the entity from result
    if (result.raw && Array.isArray(result.raw) && result.raw.length > 0) {
      return result.raw[0] as Company;
    }

    // If no result (shouldn't happen), find by name
    const foundCompany = await this.companyRepository.findOne({
      where: { name: comp.name },
    });
    if (!foundCompany) {
      throw new Error(`Failed to find or create company: ${comp.name}`);
    }
    return foundCompany;
  }

  private async upsertLocations(loc: Location): Promise<Location> {
    const result = await this.locationRepository
      .createQueryBuilder()
      .insert()
      .into(Location)
      .values(loc)
      .orIgnore()
      .returning('*')
      .execute();

    // If insert happened, return the entity from result
    if (result.raw && Array.isArray(result.raw) && result.raw.length > 0) {
      return result.raw[0] as Location;
    }

    // If ignored (already exists), find the existing entity
    const foundLocation = await this.locationRepository.findOne({
      where: { city: loc.city, state: loc.state },
    });
    if (!foundLocation) {
      throw new Error(
        `Failed to find or create location: ${loc.city}, ${loc.state}`,
      );
    }
    return foundLocation;
  }

  private async upsertJobs(job: Job): Promise<void> {
    const jobWithIds = await this.prepareJobsWithRelationIds(job);

    await this.jobRepository
      .createQueryBuilder()
      .insert()
      .into(Job)
      .values(jobWithIds)
      .orUpdate(
        [
          'title',
          'type',
          'salaryMin',
          'salaryMax',
          'currency',
          'experience',
          'remote',
          'skills',
          'postedDate',
          'companyId',
          'locationId',
        ],
        ['sourceId'],
      )
      .execute();
  }

  private async prepareJobsWithRelationIds(job: Job): Promise<Job> {
    job.company = await this.upsertCompanies(job.company);
    job.location = await this.upsertLocations(job.location);

    return job;
  }

  async findJobs(queryDto: JobQueryDto) {
    const { page = 1, limit = 10, ...filters } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.location', 'location');

    // Apply filters
    if (filters.title) {
      queryBuilder.andWhere('job.title ILIKE :title', {
        title: `%${filters.title}%`,
      });
    }

    if (filters.city) {
      queryBuilder.andWhere('location.city ILIKE :city', {
        city: `%${filters.city}%`,
      });
    }

    if (filters.state) {
      queryBuilder.andWhere('location.state ILIKE :state', {
        state: `%${filters.state}%`,
      });
    }

    if (filters.remote !== undefined) {
      queryBuilder.andWhere('job.remote = :remote', {
        remote: filters.remote,
      });
    }

    if (filters.company) {
      queryBuilder.andWhere('company.name ILIKE :company', {
        company: `%${filters.company}%`,
      });
    }

    if (filters.salaryMin) {
      queryBuilder.andWhere('job.salaryMin >= :salaryMin', {
        salaryMin: filters.salaryMin,
      });
    }

    if (filters.salaryMax) {
      queryBuilder.andWhere('job.salaryMax <= :salaryMax', {
        salaryMax: filters.salaryMax,
      });
    }

    // Get total count for pagination
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const jobs = await queryBuilder
      .orderBy('job.postedDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: jobs,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
