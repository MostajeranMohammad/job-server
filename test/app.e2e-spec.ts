/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JobSyncService } from './../src/jobs/services/job-sync.service';
import { JobManagerService } from './../src/jobs/services/job-manager.service';

describe('JobsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // stub data
    const jobs = [
      {
        id: 1,
        title: 'Frontend Developer',
        city: 'Seattle',
        state: 'WA',
        remote: true,
        company: 'TechCorp',
        salary: 100000,
      },
      {
        id: 2,
        title: 'Backend Engineer',
        city: 'New York',
        state: 'NY',
        remote: false,
        company: 'OtherCorp',
        salary: 120000,
      },
    ];
    // stubbed findJobs respects filters & pagination
    const findJobs = jest.fn((q) => {
      let items = jobs;
      if (q.title) items = items.filter((j) => j.title.includes(q.title));
      if (q.city) items = items.filter((j) => j.city === q.city);
      if (q.state) items = items.filter((j) => j.state === q.state);
      if (q.remote !== undefined)
        items = items.filter((j) => j.remote === q.remote);
      if (q.company) items = items.filter((j) => j.company.includes(q.company));
      if (q.salaryMin !== undefined)
        items = items.filter((j) => j.salary >= q.salaryMin);
      if (q.salaryMax !== undefined)
        items = items.filter((j) => j.salary <= q.salaryMax);
      const total = items.length;
      const page = q.page || 1;
      const limit = q.limit || total;
      const offset = (page - 1) * limit;
      return { total, items: items.slice(offset, offset + limit) };
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JobSyncService)
      .useValue({ syncJobs: async () => {}, manualSync: async () => {} })
      .overrideProvider(JobManagerService)
      .useValue({ findJobs })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/job-offers (GET) should return 200 and JSON', () => {
    return request(app.getHttpServer())
      .get('/api/job-offers')
      .expect(200)
      .expect('Content-Type', /json/);
  });

  it('/api/job-offers (GET) with query params should return 200 and JSON', () => {
    return request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ limit: 5, offset: 10 })
      .expect(200)
      .expect('Content-Type', /json/);
  });

  it('filters by title', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ title: 'Engineer' })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toContain('Engineer');
  });

  it('filters by city & state', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ city: 'Seattle', state: 'WA' })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].city).toBe('Seattle');
  });

  it('filters by remote flag', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ remote: true })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].remote).toBe(true);
  });

  it('filters by company substring', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ company: 'Tech' })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].company).toContain('Tech');
  });

  it('filters by salary range', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ salaryMin: 110000, salaryMax: 130000 })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].salary).toBeGreaterThanOrEqual(110000);
  });

  it('paginates results correctly', async () => {
    // limit=1 should return only first matching item
    const res = await request(app.getHttpServer())
      .get('/api/job-offers')
      .query({ limit: 1, page: 2 })
      .expect(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].id).toBe(2);
  });
});
