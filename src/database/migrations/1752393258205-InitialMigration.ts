import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1752393258205 implements MigrationInterface {
  name = 'InitialMigration1752393258205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "industry" character varying, "website" character varying, CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" SERIAL NOT NULL, "city" character varying, "state" character varying, "remote" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_8737500f67ef14694ded05807ec" UNIQUE ("city", "state", "remote"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "job" ("id" SERIAL NOT NULL, "sourceId" character varying, "title" character varying NOT NULL, "type" character varying, "salaryMin" integer, "salaryMax" integer, "currency" character varying, "experience" integer, "skills" text, "postedDate" date, "companyId" integer, "locationId" integer, CONSTRAINT "UQ_ad7dc77e813a6be1022fe690b35" UNIQUE ("sourceId"), CONSTRAINT "PK_98ab1c14ff8d1cf80d18703b92f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_e66170573cabd565dab1132727d" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_e9238c85e383495936b122f19c8" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_e9238c85e383495936b122f19c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_e66170573cabd565dab1132727d"`,
    );
    await queryRunner.query(`DROP TABLE "job"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TABLE "company"`);
  }
}
