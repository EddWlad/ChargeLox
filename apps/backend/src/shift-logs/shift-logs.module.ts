import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ShiftLog } from '../database/entities';
import { ReportsModule } from '../reports/reports.module';
import { ShiftLogsController } from './shift-logs.controller';
import { ShiftLogsService } from './shift-logs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftLog]),
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [ShiftLogsController],
  providers: [ShiftLogsService],
  exports: [ShiftLogsService, TypeOrmModule],
})
export class ShiftLogsModule {}
