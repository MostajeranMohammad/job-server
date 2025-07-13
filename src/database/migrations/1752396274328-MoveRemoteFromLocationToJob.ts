import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveRemoteFromLocationToJob1752394000000
  implements MigrationInterface
{
  name = 'MoveRemoteFromLocationToJob1752394000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add remote column to job table
    await queryRunner.query(
      `ALTER TABLE "job" ADD "remote" boolean NOT NULL DEFAULT false`,
    );

    // Copy remote data from location to job table
    await queryRunner.query(`
      UPDATE "job" 
      SET "remote" = "location"."remote" 
      FROM "location" 
      WHERE "job"."locationId" = "location"."id"
    `);

    // Drop the old unique constraint on location that included remote
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_8737500f67ef14694ded05807ec"`,
    );

    // Remove remote column from location table
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "remote"`);

    // Remove duplicate locations by keeping the one with the lowest id
    await queryRunner.query(`
      DELETE FROM "location" l1
      USING "location" l2
      WHERE
        l1."city" = l2."city"
        AND l1."state" = l2."state"
        AND l1."id" > l2."id"
    `);

    // Add new unique constraint on location without remote
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_location_city_state" UNIQUE ("city", "state")`,
    );

    // Remove old indexes that included remote field
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_remote"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_location_city_state_remote"`,
    );

    // Add new indexes for job.remote
    await queryRunner.query(
      `CREATE INDEX "IDX_job_remote" ON "job" ("remote")`,
    );

    // Update composite index for location (city, state only)
    await queryRunner.query(
      `CREATE INDEX "IDX_location_city_state" ON "location" ("city", "state")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_remote"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_city_state"`);

    // Add remote column back to location table
    await queryRunner.query(
      `ALTER TABLE "location" ADD "remote" boolean NOT NULL DEFAULT false`,
    );

    // Copy remote data back from job to location table
    await queryRunner.query(`
      UPDATE "location" 
      SET "remote" = "job"."remote" 
      FROM "job" 
      WHERE "job"."locationId" = "location"."id"
    `);

    // Drop the new unique constraint
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_location_city_state"`,
    );

    // Add back the old unique constraint with remote
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_8737500f67ef14694ded05807ec" UNIQUE ("city", "state", "remote")`,
    );

    // Remove remote column from job table
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "remote"`);

    // Restore old indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_location_remote" ON "location" ("remote")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_city_state_remote" ON "location" ("city", "state", "remote")`,
    );
  }
}
