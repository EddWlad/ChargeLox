import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ChargingPoint } from '../database/entities';
import { ReportsModule } from '../reports/reports.module';
import { ChargingPointsController } from './charging-points.controller';
import { ChargingPointsService } from './charging-points.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingPoint]),
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [ChargingPointsController],
  providers: [ChargingPointsService],
  exports: [ChargingPointsService, TypeOrmModule],
})
export class ChargingPointsModule {}
