import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { User } from '../database/entities';
import { CloudinaryService } from '../technical-activities/cloudinary.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditLogsModule],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
