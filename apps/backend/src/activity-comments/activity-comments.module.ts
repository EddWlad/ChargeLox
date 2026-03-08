import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Activity, ActivityComment } from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityCommentsController } from './activity-comments.controller';
import { ActivityCommentsService } from './activity-comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityComment, Activity]),
    NotificationsModule,
    AuditLogsModule,
  ],
  controllers: [ActivityCommentsController],
  providers: [ActivityCommentsService],
  exports: [ActivityCommentsService],
})
export class ActivityCommentsModule {}
