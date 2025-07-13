/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { JobSyncService } from './job-sync.service';
import { JobTransformationService } from './job-transformation.service';
import { JobManagerService } from './job-manager.service';
import { JobSource1Response } from '../models/job-source-1';
import { JobSource2Response } from '../models/job-source-2';
import { Job } from '../entities/job.entity';

describe('JobSyncService', () => {
  let service: JobSyncService;
  let httpService: jest.Mocked<HttpService>;
  let transformationService: jest.Mocked<JobTransformationService>;
  let jobManagerService: jest.Mocked<JobManagerService>;
  let loggerSpy: jest.SpyInstance;

  const mockSource1Response: JobSource1Response = {
    metadata: {
      requestId: 'req-123',
      timestamp: '2025-01-01T00:00:00Z',
    },
    jobs: [
      {
        jobId: 'P1-672',
        title: 'Frontend Developer',
        details: {
          location: 'Seattle, WA',
          type: 'Full-Time',
          salaryRange: '$62k - $136k',
        },
        company: {
          name: 'DataWorks',
          industry: 'Design',
        },
        skills: ['JavaScript', 'React'],
        postedDate: '2025-01-01T00:00:00Z',
      },
    ],
  };

  const mockSource2Response: JobSource2Response = {
    status: 'success',
    data: {
      jobsList: {
        'job-628': {
          position: 'Backend Developer',
          location: {
            city: 'New York',
            state: 'NY',
            remote: true,
          },
          compensation: {
            min: 61000,
            max: 111000,
            currency: 'USD',
          },
          employer: {
            companyName: 'TechCorp',
            website: 'https://techcorp.com',
          },
          requirements: {
            experience: 4,
            technologies: ['Node.js', 'Express'],
          },
          datePosted: '2025-07-07',
        },
      },
    },
  };

  const mockTransformedJob1: Job = {
    id: 1,
    sourceId: 'P1-672',
    title: 'Frontend Developer',
    type: 'Full-Time',
    salaryMin: 62000,
    salaryMax: 136000,
    currency: 'USD',
    experience: null as unknown as number,
    remote: false,
    skills: ['JavaScript', 'React'],
    postedDate: new Date('2025-01-01T00:00:00Z'),
    company: {
      id: 1,
      name: 'DataWorks',
      industry: 'Design',
      website: null as unknown as string,
      jobs: [],
    },
    location: {
      id: 1,
      city: 'Seattle',
      state: 'WA',
      jobs: [],
    },
  };

  const mockTransformedJob2: Job = {
    id: 2,
    sourceId: 'job-628',
    title: 'Backend Developer',
    type: null as unknown as string,
    salaryMin: 61000,
    salaryMax: 111000,
    currency: 'USD',
    experience: 4,
    remote: true,
    skills: ['Node.js', 'Express'],
    postedDate: new Date('2025-07-07'),
    company: {
      id: 2,
      name: 'TechCorp',
      industry: null as unknown as string,
      website: 'https://techcorp.com',
      jobs: [],
    },
    location: {
      id: 2,
      city: 'New York',
      state: 'NY',
      jobs: [],
    },
  };

  beforeEach(async () => {
    // Mock manualSync before module creation to prevent constructor side effect
    jest.spyOn(JobSyncService.prototype, 'manualSync').mockResolvedValue();

    const httpServiceMock = {
      get: jest.fn().mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        }),
      ),
    };

    const transformationServiceMock = {
      transformSource1Jobs: jest.fn().mockReturnValue([]),
      transformSource2Jobs: jest.fn().mockReturnValue([]),
    };

    const jobManagerServiceMock = {
      createJobs: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSyncService,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: JobTransformationService,
          useValue: transformationServiceMock,
        },
        {
          provide: JobManagerService,
          useValue: jobManagerServiceMock,
        },
      ],
    }).compile();

    service = module.get<JobSyncService>(JobSyncService);
    httpService = module.get(HttpService);
    transformationService = module.get(JobTransformationService);
    jobManagerService = module.get(JobManagerService);

    // Mock logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncJobs', () => {
    it('should successfully sync jobs from both sources', async () => {
      // Mock HTTP responses
      const source1AxiosResponse: AxiosResponse<JobSource1Response> = {
        data: mockSource1Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown as InternalAxiosRequestConfig,
      };

      const source2AxiosResponse: AxiosResponse<JobSource2Response> = {
        data: mockSource2Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown as InternalAxiosRequestConfig,
      };

      httpService.get
        .mockReturnValueOnce(of(source1AxiosResponse))
        .mockReturnValueOnce(of(source2AxiosResponse));

      // Mock transformation services
      transformationService.transformSource1Jobs.mockReturnValue([
        mockTransformedJob1,
      ]);
      transformationService.transformSource2Jobs.mockReturnValue([
        mockTransformedJob2,
      ]);

      // Mock job manager
      jobManagerService.createJobs.mockResolvedValue(undefined);

      await service.syncJobs();

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://assignment.devotel.io/api/provider1/jobs',
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'https://assignment.devotel.io/api/provider2/jobs',
      );

      expect(transformationService.transformSource1Jobs).toHaveBeenCalledWith(
        mockSource1Response,
      );
      expect(transformationService.transformSource2Jobs).toHaveBeenCalledWith(
        mockSource2Response,
      );

      expect(jobManagerService.createJobs).toHaveBeenCalledWith([
        mockTransformedJob1,
        mockTransformedJob2,
      ]);

      expect(loggerSpy).toHaveBeenCalledWith('Starting job synchronization...');
      expect(loggerSpy).toHaveBeenCalledWith('Fetched 1 jobs from source 1');
      expect(loggerSpy).toHaveBeenCalledWith('Fetched 1 jobs from source 2');
    });

    it('should handle errors during synchronization', async () => {
      const error = new Error('Network error');
      httpService.get.mockReturnValue(throwError(() => error));

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.syncJobs();

      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching from source 1:',
        error,
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching from source 2:',
        error,
      );
    });

    it('should handle partial failures (one source fails)', async () => {
      // Source 1 succeeds
      const source1AxiosResponse: AxiosResponse<JobSource1Response> = {
        data: mockSource1Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      // Source 2 fails
      httpService.get
        .mockReturnValueOnce(of(source1AxiosResponse))
        .mockReturnValueOnce(throwError(() => new Error('Source 2 error')));

      transformationService.transformSource1Jobs.mockReturnValue([
        mockTransformedJob1,
      ]);
      jobManagerService.createJobs.mockResolvedValue(undefined);

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.syncJobs();

      expect(transformationService.transformSource1Jobs).toHaveBeenCalledWith(
        mockSource1Response,
      );
      expect(jobManagerService.createJobs).toHaveBeenCalledWith([
        mockTransformedJob1,
      ]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching from source 2:',
        expect.any(Error),
      );
    });

    it('should handle empty responses from sources', async () => {
      const emptySource1Response: JobSource1Response = {
        metadata: { requestId: 'req-123', timestamp: '2025-01-01T00:00:00Z' },
        jobs: [],
      };

      const emptySource2Response: JobSource2Response = {
        status: 'success',
        data: { jobsList: {} },
      };

      const source1AxiosResponse: AxiosResponse<JobSource1Response> = {
        data: emptySource1Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      const source2AxiosResponse: AxiosResponse<JobSource2Response> = {
        data: emptySource2Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get
        .mockReturnValueOnce(of(source1AxiosResponse))
        .mockReturnValueOnce(of(source2AxiosResponse));

      transformationService.transformSource1Jobs.mockReturnValue([]);
      transformationService.transformSource2Jobs.mockReturnValue([]);
      jobManagerService.createJobs.mockResolvedValue(undefined);

      await service.syncJobs();

      expect(jobManagerService.createJobs).toHaveBeenCalledWith([]);
      expect(loggerSpy).toHaveBeenCalledWith('Fetched 0 jobs from source 1');
      expect(loggerSpy).toHaveBeenCalledWith('Fetched 0 jobs from source 2');
    });
  });

  describe('fetchAndTransformSource1', () => {
    it('should successfully fetch and transform source 1 jobs', async () => {
      const axiosResponse: AxiosResponse<JobSource1Response> = {
        data: mockSource1Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(axiosResponse));
      transformationService.transformSource1Jobs.mockReturnValue([
        mockTransformedJob1,
      ]);

      // Access private method through any casting for testing
      const result = await (service as any).fetchAndTransformSource1();

      expect(result).toEqual([mockTransformedJob1]);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://assignment.devotel.io/api/provider1/jobs',
      );
      expect(transformationService.transformSource1Jobs).toHaveBeenCalledWith(
        mockSource1Response,
      );
    });

    it('should return empty array on error', async () => {
      const error = new Error('HTTP error');
      httpService.get.mockReturnValue(throwError(() => error));

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      const result = await (service as any).fetchAndTransformSource1();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching from source 1:',
        error,
      );
    });
  });

  describe('fetchAndTransformSource2', () => {
    it('should successfully fetch and transform source 2 jobs', async () => {
      const axiosResponse: AxiosResponse<JobSource2Response> = {
        data: mockSource2Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(axiosResponse));
      transformationService.transformSource2Jobs.mockReturnValue([
        mockTransformedJob2,
      ]);

      const result = await (service as any).fetchAndTransformSource2();

      expect(result).toEqual([mockTransformedJob2]);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://assignment.devotel.io/api/provider2/jobs',
      );
      expect(transformationService.transformSource2Jobs).toHaveBeenCalledWith(
        mockSource2Response,
      );
    });

    it('should return empty array on error', async () => {
      const error = new Error('HTTP error');
      httpService.get.mockReturnValue(throwError(() => error));

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      const result = await (service as any).fetchAndTransformSource2();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching from source 2:',
        error,
      );
    });
  });

  describe('manualSync', () => {
    it('should call syncJobs when manualSync is triggered', async () => {
      // Restore the original manualSync method
      (service as any).manualSync.mockRestore();
      const syncJobsSpy = jest.spyOn(service, 'syncJobs').mockResolvedValue();

      await service.manualSync();

      expect(syncJobsSpy).toHaveBeenCalled();
    });
  });

  describe('constructor initialization', () => {
    it('should call manualSync during initialization', async () => {
      // Create a new instance to test constructor behavior
      const httpServiceMock = {
        get: jest.fn().mockReturnValue(
          of({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as InternalAxiosRequestConfig,
          }),
        ),
      };
      const transformationServiceMock = {
        transformSource1Jobs: jest.fn().mockReturnValue([]),
        transformSource2Jobs: jest.fn().mockReturnValue([]),
      };
      const jobManagerServiceMock = {
        createJobs: jest.fn().mockResolvedValue(undefined),
      };

      const manualSyncSpy = jest
        .spyOn(JobSyncService.prototype, 'manualSync')
        .mockResolvedValue();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JobSyncService,
          { provide: HttpService, useValue: httpServiceMock },
          {
            provide: JobTransformationService,
            useValue: transformationServiceMock,
          },
          { provide: JobManagerService, useValue: jobManagerServiceMock },
        ],
      }).compile();

      const newService = module.get<JobSyncService>(JobSyncService);

      expect(manualSyncSpy).toHaveBeenCalled();
      expect(newService).toBeDefined();

      manualSyncSpy.mockRestore();
    });

    it('should handle manualSync error during initialization', async () => {
      const httpServiceMock = {
        get: jest.fn().mockReturnValue(
          of({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as InternalAxiosRequestConfig,
          }),
        ),
      };
      const transformationServiceMock = {
        transformSource1Jobs: jest.fn().mockReturnValue([]),
        transformSource2Jobs: jest.fn().mockReturnValue([]),
      };
      const jobManagerServiceMock = {
        createJobs: jest.fn().mockResolvedValue(undefined),
      };

      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const manualSyncSpy = jest
        .spyOn(JobSyncService.prototype, 'manualSync')
        .mockRejectedValue(new Error('Initialization sync failed'));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JobSyncService,
          { provide: HttpService, useValue: httpServiceMock },
          {
            provide: JobTransformationService,
            useValue: transformationServiceMock,
          },
          { provide: JobManagerService, useValue: jobManagerServiceMock },
        ],
      }).compile();

      const newService = module.get<JobSyncService>(JobSyncService);

      // Wait for async constructor logic
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(newService).toBeDefined();
      expect(errorSpy).toHaveBeenCalledWith(
        'Manual sync failed',
        expect.any(Error),
      );

      manualSyncSpy.mockRestore();
    });
  });

  describe('error handling edge cases', () => {
    it('should handle transformation service errors', async () => {
      const source1AxiosResponse: AxiosResponse<JobSource1Response> = {
        data: mockSource1Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(source1AxiosResponse));
      transformationService.transformSource1Jobs.mockImplementation(() => {
        throw new Error('Transformation error');
      });

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      const result = await (service as any).fetchAndTransformSource1();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching from source 1:',
        expect.any(Error),
      );
    });

    it('should handle job manager service errors', async () => {
      const source1AxiosResponse: AxiosResponse<JobSource1Response> = {
        data: mockSource1Response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(source1AxiosResponse));
      transformationService.transformSource1Jobs.mockReturnValue([
        mockTransformedJob1,
      ]);
      transformationService.transformSource2Jobs.mockReturnValue([]);
      jobManagerService.createJobs.mockRejectedValue(
        new Error('Database error'),
      );

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.syncJobs();

      expect(errorSpy).toHaveBeenCalledWith(
        'Error during job synchronization:',
        expect.any(Error),
      );
    });
  });
});
