import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "rol_usuario_enum" AS ENUM ('ADMINISTRADOR', 'ANALISTA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "prioridad_enum" AS ENUM ('ALTA', 'MEDIA', 'BAJA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "estado_punto_enum" AS ENUM ('LIBRE', 'OCPP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "estado_conexion_enum" AS ENUM ('OK', 'DESCONECTADO', 'CONECTANDO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tipo_punto_enum" AS ENUM ('PUNTO_CARGA', 'ELECTROLINERA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "estado_turno_enum" AS ENUM ('ABIERTO', 'CERRADO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tipo_actividad_enum" AS ENUM ('NOVEDAD', 'SEGUIMIENTO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "estado_actividad_enum" AS ENUM ('EN_REVISION', 'EN_PROCESO', 'COMPLETADA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "accion_auditoria_enum" AS ENUM ('CREATE', 'UPDATE', 'DELETE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombres" character varying(120) NOT NULL,
        "apellidos" character varying(120),
        "email" character varying(150) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "rol" "rol_usuario_enum" NOT NULL DEFAULT 'ANALISTA',
        "avatar_url" character varying(255),
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usuarios_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usuarios_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "puntos_carga" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying(120) NOT NULL,
        "codigo_asignado" character varying(60) NOT NULL,
        "serial" character varying(120) NOT NULL,
        "puk" character varying(120) NOT NULL,
        "prioridad" "prioridad_enum" NOT NULL DEFAULT 'MEDIA',
        "estado" "estado_punto_enum" NOT NULL DEFAULT 'LIBRE',
        "estado_conexion" "estado_conexion_enum" NOT NULL DEFAULT 'OK',
        "puerto" character varying(50) NOT NULL,
        "tipo" "tipo_punto_enum" NOT NULL DEFAULT 'PUNTO_CARGA',
        "imagen_url" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_puntos_carga_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_puntos_carga_codigo_asignado" UNIQUE ("codigo_asignado")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "turnos_monitoreo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "fecha_turno" date NOT NULL,
        "hora_inicio" TIMESTAMPTZ NOT NULL,
        "hora_fin" TIMESTAMPTZ,
        "total_horas" numeric(5,2),
        "estado_turno" "estado_turno_enum" NOT NULL DEFAULT 'ABIERTO',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_turnos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_turnos_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "actividades" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fecha_novedad" TIMESTAMPTZ NOT NULL,
        "fecha_modificacion" TIMESTAMPTZ NOT NULL,
        "creado_por_id" uuid NOT NULL,
        "creado_por_nombre" character varying(180) NOT NULL,
        "tipo_actividad" "tipo_actividad_enum" NOT NULL,
        "prioridad" "prioridad_enum" NOT NULL DEFAULT 'MEDIA',
        "descripcion" text NOT NULL,
        "estado" "estado_actividad_enum" NOT NULL DEFAULT 'EN_REVISION',
        "usuario_id" uuid,
        "turno_id" uuid,
        "charging_point_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actividades_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_actividades_creado_por" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_actividades_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_actividades_turno" FOREIGN KEY ("turno_id") REFERENCES "turnos_monitoreo"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_actividades_cp" FOREIGN KEY ("charging_point_id") REFERENCES "puntos_carga"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comentarios_actividad" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actividad_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "nombre_usuario" character varying(180) NOT NULL,
        "comentario" text NOT NULL,
        "estado_nuevo" "estado_actividad_enum",
        "fecha_comentario" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comentarios_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comentarios_actividad" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comentarios_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "adjuntos_actividad" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actividad_id" uuid NOT NULL,
        "nombre_original" character varying(255) NOT NULL,
        "nombre_guardado" character varying(255) NOT NULL,
        "mime_type" character varying(120) NOT NULL,
        "extension" character varying(15) NOT NULL,
        "tamano" integer NOT NULL,
        "ruta_archivo" character varying(255) NOT NULL,
        "subido_por_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_adjuntos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_adjuntos_actividad" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_adjuntos_usuario" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notificaciones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_destino_id" uuid NOT NULL,
        "titulo" character varying(180) NOT NULL,
        "mensaje" text NOT NULL,
        "tipo" character varying(80) NOT NULL,
        "referencia_id" uuid,
        "leida" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notificaciones_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notificaciones_usuario" FOREIGN KEY ("usuario_destino_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "auditoria" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entidad" character varying(80) NOT NULL,
        "entidad_id" character varying(100) NOT NULL,
        "accion" "accion_auditoria_enum" NOT NULL,
        "usuario_id" uuid,
        "usuario_email" character varying(150),
        "resumen_cambio" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auditoria_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auditoria_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_turnos_usuario_estado" ON "turnos_monitoreo" ("usuario_id", "estado_turno")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_prioridad_estado" ON "actividades" ("prioridad", "estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actividades_tipo" ON "actividades" ("tipo_actividad")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notificaciones_usuario_leida" ON "notificaciones" ("usuario_destino_id", "leida")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auditoria_entidad" ON "auditoria" ("entidad", "entidad_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auditoria_entidad"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notificaciones_usuario_leida"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_actividades_tipo"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividades_prioridad_estado"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_turnos_usuario_estado"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "auditoria"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notificaciones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "adjuntos_actividad"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comentarios_actividad"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "actividades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "turnos_monitoreo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "puntos_carga"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "accion_auditoria_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_actividad_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_actividad_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_turno_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_punto_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_conexion_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_punto_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "prioridad_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rol_usuario_enum"`);
  }
}
