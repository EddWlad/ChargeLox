import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import {
  ChargingPoint,
  TechnicalActivity,
  TechnicalActivityComment,
  TechnicalActivityEvidence,
  TechnicalActivityHistory,
  User,
} from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { CloudinaryService } from './cloudinary.service';
import { TechnicalActivitiesController } from './technical-activities.controller';
import { TechnicalActivitiesService } from './technical-activities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TechnicalActivity,
      TechnicalActivityComment,
      TechnicalActivityEvidence,
      TechnicalActivityHistory,
      User,
      ChargingPoint,
    ]),
    NotificationsModule,
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [TechnicalActivitiesController],
  providers: [TechnicalActivitiesService, CloudinaryService],
  exports: [TechnicalActivitiesService],
})
export class TechnicalActivitiesModule {}
