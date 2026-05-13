import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, Enrollment, HomeworkSubmission, ReviewDecision, User, VideoLesson } from '../../database/entities';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(HomeworkSubmission) private submissions: Repository<HomeworkSubmission>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(VideoLesson) private videos: Repository<VideoLesson>,
    @InjectRepository(Course) private courses: Repository<Course>,
    private notifications: NotificationsService,
  ) {}

  async submit(learner: User, input: { enrollmentId: string; videoId: string; fileUrl?: string; textAnswer?: string }) {
    const enrollment = await this.enrollments.findOne({ where: { id: input.enrollmentId } });
    if (!enrollment || enrollment.learnerId !== learner.id) throw new ForbiddenException();
    const video = await this.videos.findOne({ where: { id: input.videoId } });
    if (!video || video.position > enrollment.unlockedVideoPosition) throw new ForbiddenException('Video is locked');
    const course = await this.courses.findOne({ where: { id: enrollment.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const submission = await this.submissions.save(input);
    await this.notifications.create(course.trainerId, 'New homework submitted', `${learner.name} submitted homework for ${video.title}`);
    return submission;
  }

  listForTrainer(trainerId: string) {
    return this.submissions
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.learner', 'learner')
      .leftJoinAndSelect('submission.video', 'video')
      .leftJoin(Course, 'course', 'course.id = enrollment.courseId')
      .where('course.trainerId = :trainerId', { trainerId })
      .orderBy('submission.createdAt', 'DESC')
      .getMany();
  }

  async review(trainer: User, submissionId: string, decision: ReviewDecision, remarks?: string) {
    const submission = await this.submissions.findOne({
      where: { id: submissionId },
      relations: ['enrollment', 'video'],
    });
    if (!submission) throw new NotFoundException('Submission not found');
    const course = await this.courses.findOne({ where: { id: submission.enrollment.courseId } });
    if (!course || course.trainerId !== trainer.id) throw new ForbiddenException();

    submission.trainerDecision = decision;
    submission.trainerRemarks = remarks;
    const saved = await this.submissions.save(submission);

    await this.notifications.create(
      submission.enrollment.learnerId,
      `Homework ${decision}`,
      decision === ReviewDecision.Fail
        ? 'Please rewatch the video and attempt a different retest set.'
        : remarks ?? 'Your trainer reviewed your homework.',
    );
    return saved;
  }
}
