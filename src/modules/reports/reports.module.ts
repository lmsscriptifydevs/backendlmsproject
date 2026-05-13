import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Institution, StudentReport, User } from '../../database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentReport, User, Course, Institution])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
