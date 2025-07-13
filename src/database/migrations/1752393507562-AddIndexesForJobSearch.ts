import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesForJobSearch1752393507562 implements MigrationInterface {
  name = 'AddIndexesForJobSearch1752393507562';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm extension for trigram indexes (must be first)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Job table indexes
    // Index for title searches (ILIKE operations)
    await queryRunner.query(
      `CREATE INDEX "IDX_job_title_gin" ON "job" USING gin (title gin_trgm_ops)`,
    );

    // Index for salary range queries
    await queryRunner.query(
      `CREATE INDEX "IDX_job_salary_min" ON "job" ("salaryMin")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_job_salary_max" ON "job" ("salaryMax")`,
    );

    // Index for posted date (used in ORDER BY)
    await queryRunner.query(
      `CREATE INDEX "IDX_job_posted_date" ON "job" ("postedDate" DESC)`,
    );

    // Index for sourceId (used in unique constraint and potentially lookups)
    await queryRunner.query(
      `CREATE INDEX "IDX_job_source_id" ON "job" ("sourceId")`,
    );

    // Company table indexes
    // Index for company name searches (ILIKE operations)
    await queryRunner.query(
      `CREATE INDEX "IDX_company_name_gin" ON "company" USING gin (name gin_trgm_ops)`,
    );

    // Location table indexes
    // Index for city searches (ILIKE operations)
    await queryRunner.query(
      `CREATE INDEX "IDX_location_city_gin" ON "location" USING gin (city gin_trgm_ops)`,
    );

    // Index for state searches (ILIKE operations)
    await queryRunner.query(
      `CREATE INDEX "IDX_location_state_gin" ON "location" USING gin (state gin_trgm_ops)`,
    );

    // Index for remote filter
    await queryRunner.query(
      `CREATE INDEX "IDX_location_remote" ON "location" ("remote")`,
    );

    // Composite indexes for common filter combinations
    // Job with company and location foreign keys (for joins)
    await queryRunner.query(
      `CREATE INDEX "IDX_job_company_location" ON "job" ("companyId", "locationId")`,
    );

    // Job with salary range and posted date (common combination)
    await queryRunner.query(
      `CREATE INDEX "IDX_job_salary_date" ON "job" ("salaryMin", "salaryMax", "postedDate" DESC)`,
    );

    // Location composite for city, state, remote combination
    await queryRunner.query(
      `CREATE INDEX "IDX_location_city_state_remote" ON "location" ("city", "state", "remote")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_location_city_state_remote"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_salary_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_company_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_remote"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_state_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_city_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_company_name_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_source_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_posted_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_salary_max"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_salary_min"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_title_gin"`);

    // Note: We don't drop the pg_trgm extension as it might be used by other parts of the application
  }
}
