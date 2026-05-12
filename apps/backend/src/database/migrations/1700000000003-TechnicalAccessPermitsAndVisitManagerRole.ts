import { MigrationInterface, QueryRunner } from 'typeorm';

export class TechnicalAccessPermitsAndVisitManagerRole1700000000003
  implements MigrationInterface
{
  name = 'TechnicalAccessPermitsAndVisitManagerRole1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "rol_usuario_enum" ADD VALUE IF NOT EXISTS 'GESTOR_DE_VISITAS'`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          WHERE t.typname = 'estado_permiso_acceso_enum'
        ) THEN
          CREATE TYPE "estado_permiso_acceso_enum" AS ENUM ('NOT_REQUIRED', 'PENDING', 'UPLOADED');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "requires_access_permit" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "access_permit_status" "estado_permiso_acceso_enum" NOT NULL DEFAULT 'NOT_REQUIRED'
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "access_permit_file_url" character varying(500)
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "access_permit_file_name" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "access_permit_mime_type" character varying(120)
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "access_permit_uploaded_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN IF NOT EXISTS "access_permit_uploaded_by_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_actividades_tecnicas_access_permit_uploaded_by'
        ) THEN
          ALTER TABLE "actividades_tecnicas"
          ADD CONSTRAINT "FK_actividades_tecnicas_access_permit_uploaded_by"
          FOREIGN KEY ("access_permit_uploaded_by_id")
          REFERENCES "usuarios"("id")
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      UPDATE "actividades_tecnicas"
      SET "access_permit_status" = CASE
        WHEN "requires_access_permit" = true THEN 'PENDING'::"estado_permiso_acceso_enum"
        ELSE 'NOT_REQUIRED'::"estado_permiso_acceso_enum"
      END
      WHERE "access_permit_status" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      DROP CONSTRAINT IF EXISTS "FK_actividades_tecnicas_access_permit_uploaded_by"
    `);
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "access_permit_uploaded_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "access_permit_uploaded_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "access_permit_mime_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "access_permit_file_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "access_permit_file_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "access_permit_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "requires_access_permit"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_permiso_acceso_enum"`);
  }
}

