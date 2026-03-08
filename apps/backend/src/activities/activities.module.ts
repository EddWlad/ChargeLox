import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import {
  Activity,
  ActivityComment,
  Attachment,
  User,
} from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityComment, Attachment, User]),
    NotificationsModule,
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService, TypeOrmModule],
})
export class ActivitiesModule {}
