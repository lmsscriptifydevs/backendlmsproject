import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Enrollment, HomeworkSubmission, VideoLesson } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([HomeworkSubmission, Enrollment, VideoLesson, Course]), NotificationsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
