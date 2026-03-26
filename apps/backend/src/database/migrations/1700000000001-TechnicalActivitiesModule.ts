import { MigrationInterface, QueryRunner } from 'typeorm';

export class TechnicalActivitiesModule1700000000001
  implements MigrationInterface
{
  name = 'TechnicalActivitiesModule1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "rol_usuario_enum" ADD VALUE IF NOT EXISTS 'SUPERVISOR'`,
    );
    await queryRunner.query(
      `ALTER TYPE "rol_usuario_enum" ADD VALUE IF NOT EXISTS 'TECNICO'`,
    );

    await queryRunner.query(
      `CREATE TYPE "tipo_actividad_tecnica_enum" AS ENUM ('INSTALACION', 'MANTENIMIENTO_PREVENTIVO', 'MANTENIMIENTO_CORRECTIVO', 'VISITA_TECNICA', 'REVISION_TECNICA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "estado_actividad_tecnica_enum" AS ENUM ('ASIGNADA', 'EN_PROCESO', 'COMPLETADA', 'OBSERVADA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "evidencia_storage_provider_enum" AS ENUM ('LOCAL', 'CLOUDINARY')`,
    );

    await queryRunner.query(`
      CREATE TABLE "actividades_tecnicas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tipo_actividad" "tipo_actividad_tecnica_enum" NOT NULL,
        "titulo" character varying(180) NOT NULL,
        "descripcion" text NOT NULL,
        "prioridad" "prioridad_enum" NOT NULL DEFAULT 'MEDIA',
        "estado" "estado_actividad_tecnica_enum" NOT NULL DEFAULT 'ASIGNADA',
        "creado_por_id" uuid NOT NULL,
        "creado_por_nombre" character varying(180) NOT NULL,
        "tecnico_asignado_id" uuid NOT NULL,
        "supervisor_asignador_id" uuid NOT NULL,
        "fecha_programada" date NOT NULL,
        "fecha_limite" date,
        "fecha_ejecucion" date,
        "fecha_instalacion" date,
        "ubicacion" character varying(200),
        "charging_point_id" uuid,
        "codigo_asignado" character varying(120),
        "serial" character varying(120),
        "puk" character varying(120),
        "marca" character varying(80),
        "modelo" character varying(120),
        "estado_inicial" character varying(80),
        "caracteristicas_tecnicas" text,
        "diagnostico" text,
        "hallazgos" text,
        "acciones_realizadas" text,
        "componentes_intervenidos" text,
        "recomendaciones" text,
        "estado_final" character varying(80),
        "observaciones_iniciales" text,
        "observaciones_ejecucion" text,
        "observaciones_cierre" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actividades_tecnicas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_actividades_tecnicas_creado_por" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_actividades_tecnicas_tecnico" FOREIGN KEY ("tecnico_asignado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_actividades_tecnicas_supervisor" FOREIGN KEY ("supervisor_asignador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_actividades_tecnicas_cp" FOREIGN KEY ("charging_point_id") REFERENCES "puntos_carga"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comentarios_actividad_tecnica" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actividad_tecnica_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "nombre_usuario" character varying(180) NOT NULL,
        "comentario" text NOT NULL,
        "estado_nuevo" "estado_actividad_tecnica_enum",
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comentarios_actividad_tecnica_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comentarios_actividad_tecnica_actividad" FOREIGN KEY ("actividad_tecnica_id") REFERENCES "actividades_tecnicas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comentarios_actividad_tecnica_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "evidencias_actividad_tecnica" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actividad_tecnica_id" uuid NOT NULL,
        "subido_por_id" uuid NOT NULL,
        "nombre_original" character varying(255) NOT NULL,
        "nombre_guardado" character varying(255) NOT NULL,
        "mime_type" character varying(120) NOT NULL,
        "tamano" integer NOT NULL,
        "storage_provider" "evidencia_storage_provider_enum" NOT NULL DEFAULT 'LOCAL',
        "ruta_archivo" character varying(500),
        "cloudinary_public_id" character varying(255),
        "cloudinary_url" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_evidencias_actividad_tecnica_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_evidencias_actividad_tecnica_actividad" FOREIGN KEY ("actividad_tecnica_id") REFERENCES "actividades_tecnicas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_evidencias_actividad_tecnica_usuario" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "historial_actividad_tecnica" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actividad_tecnica_id" uuid NOT NULL,
        "actor_id" uuid,
        "actor_nombre" character varying(180),
        "accion" character varying(80) NOT NULL,
        "descripcion" text NOT NULL,
        "estado_anterior" "estado_actividad_tecnica_enum",
        "estado_nuevo" "estado_actividad_tecnica_enum",
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_historial_actividad_tecnica_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_historial_actividad_tecnica_actividad" FOREIGN KEY ("actividad_tecnica_id") REFERENCES "actividades_tecnicas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_historial_actividad_tecnica_actor" FOREIGN KEY ("actor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tecnicas_tecnico" ON "actividades_tecnicas" ("tecnico_asignado_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tecnicas_supervisor" ON "actividades_tecnicas" ("supervisor_asignador_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tecnicas_estado" ON "actividades_tecnicas" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tecnicas_tipo" ON "actividades_tecnicas" ("tipo_actividad")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tecnicas_fecha_programada" ON "actividades_tecnicas" ("fecha_programada")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tecnicas_cp" ON "actividades_tecnicas" ("charging_point_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comentarios_actividad_tecnica_actividad" ON "comentarios_actividad_tecnica" ("actividad_tecnica_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_evidencias_actividad_tecnica_actividad" ON "evidencias_actividad_tecnica" ("actividad_tecnica_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_historial_actividad_tecnica_actividad" ON "historial_actividad_tecnica" ("actividad_tecnica_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_historial_actividad_tecnica_actividad"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_evidencias_actividad_tecnica_actividad"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_comentarios_actividad_tecnica_actividad"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_tecnicas_cp"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_tecnicas_fecha_programada"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_tecnicas_tipo"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_tecnicas_estado"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_tecnicas_supervisor"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_tecnicas_tecnico"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "historial_actividad_tecnica"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "evidencias_actividad_tecnica"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comentarios_actividad_tecnica"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "actividades_tecnicas"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "evidencia_storage_provider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "estado_actividad_tecnica_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "tipo_actividad_tecnica_enum"`,
    );
  }
}
