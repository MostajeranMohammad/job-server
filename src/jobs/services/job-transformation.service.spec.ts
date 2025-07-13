import { Test, TestingModule } from '@nestjs/testing';
import { JobTransformationService } from './job-transformation.service';
import { JobSource1Response } from '../models/job-source-1';
import { JobSource2Response } from '../models/job-source-2';
import { Job } from '../entities/job.entity';

describe('JobTransformationService', () => {
  let service: JobTransformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobTransformationService],
    }).compile();

    service = module.get<JobTransformationService>(JobTransformationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transformSource1Jobs', () => {
    it('should transform valid source 1 response with multiple jobs', () => {
      const response: JobSource1Response = {
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
            skills: ['JavaScript', 'React', 'TypeScript'],
            postedDate: '2025-01-01T00:00:00Z',
          },
          {
            jobId: 'P1-311',
            title: 'Backend Engineer',
            details: {
              location: 'San Francisco, CA',
              type: 'Part-Time',
              salaryRange: '$90k - $130k',
            },
            company: {
              name: 'TechCorp',
              industry: 'Technology',
            },
            skills: ['Node.js', 'Express'],
            postedDate: '2025-01-02T00:00:00Z',
          },
        ],
      };

      const result = service.transformSource1Jobs(response);

      expect(result).toHaveLength(2);

      // Test first job
      expect(result[0].sourceId).toBe('P1-672');
      expect(result[0].title).toBe('Frontend Developer');
      expect(result[0].type).toBe('Full-Time');
      expect(result[0].salaryMin).toBe(62000);
      expect(result[0].salaryMax).toBe(136000);
      expect(result[0].currency).toBe('USD');
      expect(result[0].remote).toBe(false);
      expect(result[0].skills).toEqual(['JavaScript', 'React', 'TypeScript']);
      expect(result[0].company.name).toBe('DataWorks');
      expect(result[0].company.industry).toBe('Design');
      expect(result[0].location.city).toBe('Seattle');
      expect(result[0].location.state).toBe('WA');

      // Test second job
      expect(result[1].sourceId).toBe('P1-311');
      expect(result[1].salaryMin).toBe(90000);
      expect(result[1].salaryMax).toBe(130000);
    });

    it('should handle empty jobs array', () => {
      const response: JobSource1Response = {
        metadata: {
          requestId: 'req-123',
          timestamp: '2025-01-01T00:00:00Z',
        },
        jobs: [],
      };

      const result = service.transformSource1Jobs(response);
      expect(result).toHaveLength(0);
    });

    it('should handle invalid salary range format', () => {
      const response: JobSource1Response = {
        metadata: {
          requestId: 'req-123',
          timestamp: '2025-01-01T00:00:00Z',
        },
        jobs: [
          {
            jobId: 'P1-672',
            title: 'Developer',
            details: {
              location: 'Seattle, WA',
              type: 'Full-Time',
              salaryRange: 'Competitive salary',
            },
            company: {
              name: 'DataWorks',
              industry: 'Design',
            },
            skills: ['JavaScript'],
            postedDate: '2025-01-01T00:00:00Z',
          },
        ],
      };

      const result = service.transformSource1Jobs(response);

      expect(result[0].salaryMin).toBe(0);
      expect(result[0].salaryMax).toBe(0);
      expect(result[0].currency).toBe('');
    });

    it('should handle location without state', () => {
      const response: JobSource1Response = {
        metadata: {
          requestId: 'req-123',
          timestamp: '2025-01-01T00:00:00Z',
        },
        jobs: [
          {
            jobId: 'P1-672',
            title: 'Developer',
            details: {
              location: 'Remote',
              type: 'Full-Time',
              salaryRange: '$60k - $80k',
            },
            company: {
              name: 'DataWorks',
              industry: 'Design',
            },
            skills: ['JavaScript'],
            postedDate: '2025-01-01T00:00:00Z',
          },
        ],
      };

      const result = service.transformSource1Jobs(response);

      expect(result[0].location.city).toBe('Remote');
      expect(result[0].location.state).toBeUndefined();
    });

    it('should handle various salary range formats', () => {
      const testCases = [
        { input: '$50k - $70k', expectedMin: 50000, expectedMax: 70000 },
        { input: '$100k - $150k', expectedMin: 100000, expectedMax: 150000 },
        { input: '$1k - $2k', expectedMin: 1000, expectedMax: 2000 },
        { input: 'invalid format', expectedMin: 0, expectedMax: 0 },
        { input: '$50k-$70k', expectedMin: 50000, expectedMax: 70000 }, // no spaces
      ];

      testCases.forEach(({ input, expectedMin, expectedMax }, index) => {
        const response: JobSource1Response = {
          metadata: { requestId: 'req-123', timestamp: '2025-01-01T00:00:00Z' },
          jobs: [
            {
              jobId: `P1-${index}`,
              title: 'Developer',
              details: {
                location: 'Seattle, WA',
                type: 'Full-Time',
                salaryRange: input,
              },
              company: { name: 'DataWorks', industry: 'Design' },
              skills: ['JavaScript'],
              postedDate: '2025-01-01T00:00:00Z',
            },
          ],
        };

        const result = service.transformSource1Jobs(response);
        expect(result[0].salaryMin).toBe(expectedMin);
        expect(result[0].salaryMax).toBe(expectedMax);
      });
    });
  });

  describe('transformSource2Jobs', () => {
    it('should transform valid source 2 response with multiple jobs', () => {
      const response: JobSource2Response = {
        status: 'success',
        data: {
          jobsList: {
            'job-628': {
              position: 'Frontend Developer',
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
                companyName: 'Creative Design Ltd',
                website: 'https://creativedesign.com',
              },
              requirements: {
                experience: 4,
                technologies: ['Java', 'Spring Boot', 'AWS'],
              },
              datePosted: '2025-07-07',
            },
            'job-302': {
              position: 'Backend Engineer',
              location: {
                city: 'San Francisco',
                state: 'CA',
                remote: false,
              },
              compensation: {
                min: 67000,
                max: 111000,
                currency: 'USD',
              },
              employer: {
                companyName: 'TechCorp',
                website: 'https://techcorp.com',
              },
              requirements: {
                experience: 5,
                technologies: ['Node.js', 'Express', 'MongoDB'],
              },
              datePosted: '2025-07-11',
            },
          },
        },
      };

      const result = service.transformSource2Jobs(response);

      expect(result).toHaveLength(2);

      // Test first job
      const job1 = result.find((job) => job.sourceId === 'job-628');
      expect(job1).toBeDefined();
      if (!job1) {
        throw new Error('Job 1 not found in the result');
      }
      expect(job1.title).toBe('Frontend Developer');
      expect(job1.salaryMin).toBe(61000);
      expect(job1.salaryMax).toBe(111000);
      expect(job1.currency).toBe('USD');
      expect(job1.experience).toBe(4);
      expect(job1.remote).toBe(true);
      expect(job1.skills).toEqual(['Java', 'Spring Boot', 'AWS']);
      expect(job1.company.name).toBe('Creative Design Ltd');
      expect(job1.company.website).toBe('https://creativedesign.com');
      expect(job1.location.city).toBe('New York');
      expect(job1.location.state).toBe('NY');

      // Test second job
      const job2 = result.find((job) => job.sourceId === 'job-302');
      if (!job2) {
        throw new Error('Job 2 not found in the result');
      }

      expect(job2).toBeDefined();
      expect(job2.remote).toBe(false);
      expect(job2.experience).toBe(5);
    });

    it('should handle empty jobs list', () => {
      const response: JobSource2Response = {
        status: 'success',
        data: {
          jobsList: {},
        },
      };

      const result = service.transformSource2Jobs(response);
      expect(result).toHaveLength(0);
    });

    it('should handle single job in jobs list', () => {
      const response: JobSource2Response = {
        status: 'success',
        data: {
          jobsList: {
            'job-123': {
              position: 'Full Stack Developer',
              location: {
                city: 'Austin',
                state: 'TX',
                remote: true,
              },
              compensation: {
                min: 80000,
                max: 120000,
                currency: 'USD',
              },
              employer: {
                companyName: 'StartupCorp',
                website: 'https://startup.com',
              },
              requirements: {
                experience: 3,
                technologies: ['React', 'Node.js'],
              },
              datePosted: '2025-01-15',
            },
          },
        },
      };

      const result = service.transformSource2Jobs(response);
      expect(result).toHaveLength(1);
      expect(result[0].sourceId).toBe('job-123');
      expect(result[0].title).toBe('Full Stack Developer');
    });

    it('should handle missing optional fields', () => {
      const response: JobSource2Response = {
        status: 'success',
        data: {
          jobsList: {
            'job-minimal': {
              position: 'Developer',
              location: {
                city: '',
                state: '',
                remote: false,
              },
              compensation: {
                min: 0,
                max: 0,
                currency: '',
              },
              employer: {
                companyName: 'MinimalCorp',
                website: '',
              },
              requirements: {
                experience: 0,
                technologies: [],
              },
              datePosted: '2025-01-01',
            },
          },
        },
      };

      const result = service.transformSource2Jobs(response);
      expect(result).toHaveLength(1);
      expect(result[0].salaryMin).toBe(0);
      expect(result[0].salaryMax).toBe(0);
      expect(result[0].currency).toBe('');
      expect(result[0].experience).toBe(0);
      expect(result[0].skills).toEqual([]);
      expect(result[0].location.city).toBe('');
      expect(result[0].location.state).toBe('');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null/undefined values in source 1', () => {
      const response: JobSource1Response = {
        metadata: {
          requestId: 'req-123',
          timestamp: '2025-01-01T00:00:00Z',
        },
        jobs: [
          {
            jobId: null as unknown as string,
            title: '',
            details: {
              location: '',
              type: null as unknown as string,
              salaryRange: null as unknown as string,
            },
            company: {
              name: '',
              industry: null as unknown as string,
            },
            skills: null as unknown as string[],
            postedDate: null as unknown as string,
          },
        ],
      };

      expect(() => service.transformSource1Jobs(response)).not.toThrow();
      const result = service.transformSource1Jobs(response);
      expect(result).toHaveLength(1);
    });

    it('should handle invalid date formats', () => {
      const response: JobSource1Response = {
        metadata: {
          requestId: 'req-123',
          timestamp: '2025-01-01T00:00:00Z',
        },
        jobs: [
          {
            jobId: 'P1-672',
            title: 'Developer',
            details: {
              location: 'Seattle, WA',
              type: 'Full-Time',
              salaryRange: '$60k - $80k',
            },
            company: {
              name: 'DataWorks',
              industry: 'Design',
            },
            skills: ['JavaScript'],
            postedDate: 'invalid-date',
          },
        ],
      };

      const result = service.transformSource1Jobs(response);
      expect(result[0].postedDate).toEqual(expect.any(Date));
      expect(isNaN(result[0].postedDate.getTime())).toBe(true);
    });

    it('should create proper entity instances', () => {
      const response: JobSource1Response = {
        metadata: {
          requestId: 'req-123',
          timestamp: '2025-01-01T00:00:00Z',
        },
        jobs: [
          {
            jobId: 'P1-672',
            title: 'Developer',
            details: {
              location: 'Seattle, WA',
              type: 'Full-Time',
              salaryRange: '$60k - $80k',
            },
            company: {
              name: 'DataWorks',
              industry: 'Design',
            },
            skills: ['JavaScript'],
            postedDate: '2025-01-01T00:00:00Z',
          },
        ],
      };

      const result = service.transformSource1Jobs(response);

      expect(result[0]).toBeInstanceOf(Job);
      expect(result[0].company.constructor.name).toBe('Company');
      expect(result[0].location.constructor.name).toBe('Location');
    });

    it('should handle complex location formats', () => {
      const testCases = [
        { input: 'Seattle, WA', expectedCity: 'Seattle', expectedState: 'WA' },
        {
          input: 'New York City, NY',
          expectedCity: 'New York City',
          expectedState: 'NY',
        },
        { input: 'Remote', expectedCity: 'Remote', expectedState: undefined },
        {
          input: 'San Francisco, CA, USA',
          expectedCity: 'San Francisco',
          expectedState: 'CA',
        },
        { input: '', expectedCity: '', expectedState: undefined },
        { input: 'Boston,MA', expectedCity: 'Boston', expectedState: 'MA' }, // no space after comma
      ];

      testCases.forEach(({ input, expectedCity, expectedState }, index) => {
        const response: JobSource1Response = {
          metadata: { requestId: 'req-123', timestamp: '2025-01-01T00:00:00Z' },
          jobs: [
            {
              jobId: `P1-${index}`,
              title: 'Developer',
              details: {
                location: input,
                type: 'Full-Time',
                salaryRange: '$60k - $80k',
              },
              company: { name: 'DataWorks', industry: 'Design' },
              skills: ['JavaScript'],
              postedDate: '2025-01-01T00:00:00Z',
            },
          ],
        };

        const result = service.transformSource1Jobs(response);
        expect(result[0].location.city).toBe(expectedCity);
        expect(result[0].location.state).toBe(expectedState);
      });
    });
  });
});
