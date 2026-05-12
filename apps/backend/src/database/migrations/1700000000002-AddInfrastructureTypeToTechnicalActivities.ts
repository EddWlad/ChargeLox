import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInfrastructureTypeToTechnicalActivities1700000000002
  implements MigrationInterface
{
  name = 'AddInfrastructureTypeToTechnicalActivities1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "infraestructura_tecnica_enum" AS ENUM ('PUNTO_CARGA', 'ELECTROLINERA', 'BARRERA')`,
    );

    await queryRunner.query(`
      ALTER TABLE "actividades_tecnicas"
      ADD COLUMN "infrastructure_type" "infraestructura_tecnica_enum" NOT NULL DEFAULT 'PUNTO_CARGA'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actividades_tecnicas" DROP COLUMN IF EXISTS "infrastructure_type"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "infraestructura_tecnica_enum"`);
  }
}

