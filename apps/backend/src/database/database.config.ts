import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import {
  Activity,
  ActivityComment,
  Attachment,
  AuditLog,
  ChargingPoint,
  ExtraActivity,
  Notification,
  ShiftLog,
  TechnicalActivity,
  TechnicalActivityComment,
  TechnicalActivityEvidence,
  TechnicalActivityHistory,
  User,
} from './entities';

loadEnv({ path: join(process.cwd(), '.env') });
loadEnv({ path: join(process.cwd(), '../../.env') });

export const getDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5430),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'chargelox',
  entities: [
    User,
    ChargingPoint,
    ShiftLog,
    Activity,
    ActivityComment,
    Attachment,
    Notification,
    AuditLog,
    ExtraActivity,
    TechnicalActivity,
    TechnicalActivityComment,
    TechnicalActivityEvidence,
    TechnicalActivityHistory,
  ],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migraciones',
  synchronize: false,
  logging: false,
});
