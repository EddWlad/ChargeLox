import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtraActivitiesModule1700000000004 implements MigrationInterface {
  name = 'ExtraActivitiesModule1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extra_activity_type_enum') THEN
          CREATE TYPE "extra_activity_type_enum" AS ENUM (
            'QA_FUNCTIONAL',
            'QA_UI',
            'BUG_REPORT',
            'BUG_FIX',
            'BUG_VALIDATION',
            'PRODUCTION_REVIEW',
            'OPERATIONAL_SUPPORT',
            'DOCUMENTATION',
            'MEETING',
            'TRAINING',
            'TECHNICAL_ANALYSIS',
            'EXTRA_MONITORING',
            'OTHER'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_time_category_enum') THEN
          CREATE TYPE "work_time_category_enum" AS ENUM (
            'DURING_SHIFT',
            'OUTSIDE_SHIFT',
            'WEEKEND_OR_HOLIDAY',
            'EMERGENCY',
            'MIXED'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extra_activity_status_enum') THEN
          CREATE TYPE "extra_activity_status_enum" AS ENUM (
            'IN_PROGRESS',
            'FINISHED',
            'CANCELLED'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extra_activity_priority_enum') THEN
          CREATE TYPE "extra_activity_priority_enum" AS ENUM (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "actividades_extra" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "type" "extra_activity_type_enum" NOT NULL,
        "title" character varying(180) NOT NULL,
        "description" text,
        "module_name" character varying(150),
        "priority" "extra_activity_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "work_time_category" "work_time_category_enum" NOT NULL,
        "external_reference" character varying(120),
        "status" "extra_activity_status_enum" NOT NULL DEFAULT 'IN_PROGRESS',
        "started_at" TIMESTAMPTZ NOT NULL,
        "ended_at" TIMESTAMPTZ,
        "duration_minutes" integer,
        "result_description" text,
        "evidence_url" character varying(500),
        "evidence_file_name" character varying(255),
        "evidence_mime_type" character varying(120),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actividades_extra_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_actividades_extra_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuarios"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividades_extra_usuario" ON "actividades_extra" ("usuario_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividades_extra_status" ON "actividades_extra" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividades_extra_started_at" ON "actividades_extra" ("started_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividades_extra_work_time_category" ON "actividades_extra" ("work_time_category")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividades_extra_usuario_status" ON "actividades_extra" ("usuario_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_extra_usuario_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_extra_work_time_category"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_extra_started_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_extra_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_extra_usuario"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "actividades_extra"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "extra_activity_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "extra_activity_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "work_time_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "extra_activity_type_enum"`);
  }
}
