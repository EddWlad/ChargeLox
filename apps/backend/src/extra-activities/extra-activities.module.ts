import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ExtraActivity, User } from '../database/entities';
import { ExtraActivitiesController } from './extra-activities.controller';
import { ExtraActivitiesService } from './extra-activities.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExtraActivity, User]), AuditLogsModule],
  controllers: [ExtraActivitiesController],
  providers: [ExtraActivitiesService],
  exports: [ExtraActivitiesService],
})
export class ExtraActivitiesModule {}
