import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AssessmentSet,
  Course,
  CourseStatus,
  Enrollment,
  EnrollmentStatus,
  LearningLevel,
  Question,
  Role,
  User,
  VideoLesson,
} from '../../database/entities';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(VideoLesson) private videos: Repository<VideoLesson>,
    @InjectRepository(AssessmentSet) private sets: Repository<AssessmentSet>,
    @InjectRepository(Question) private questions: Repository<Question>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
  ) {}

  createCourse(trainer: User, input: { title: string; description: string; level: LearningLevel }) {
    if (trainer.role !== Role.Trainer) throw new ForbiddenException('Only trainers can create courses');
    return this.courses.save({ ...input, trainerId: trainer.id, status: CourseStatus.Draft });
  }

  async submitForReview(courseId: string, trainer: User) {
    const course = await this.requireTrainerCourse(courseId, trainer);
    course.status = CourseStatus.PendingReview;
    return this.courses.save(course);
  }

  async adminReview(courseId: string, status: CourseStatus.Approved | CourseStatus.Rejected, notes?: string) {
    const course = await this.courses.findOne({ where: { id: courseId }, relations: ['videos', 'videos.assessmentSets'] });
    if (!course) throw new NotFoundException('Course not found');
    if (status === CourseStatus.Approved) {
      if (!course.videos.length) throw new BadRequestException('Course must include videos');
      if (course.videos.some((video) => !video.assessmentSets?.length)) {
        throw new BadRequestException('Every video must include at least one assessment set');
      }
    }
    course.status = status;
    course.adminReviewNotes = notes;
    return this.courses.save(course);
  }

  async addVideo(courseId: string, trainer: User, input: { title: string; position: number; videoUrl: string; summary?: string }) {
    await this.requireTrainerCourse(courseId, trainer);
    return this.videos.save({ ...input, courseId });
  }

  async addAssessmentSet(
    videoId: string,
    trainer: User,
    input: { title: string; version: number; questions: Partial<Question>[] },
  ) {
    const video = await this.videos.findOne({ where: { id: videoId }, relations: ['course'] });
    if (!video) throw new NotFoundException('Video not found');
    if (video.course.trainerId !== trainer.id && trainer.role !== Role.Admin) throw new ForbiddenException();

    const set = await this.sets.save({ videoId, title: input.title, version: input.version, active: true });
    const questions = input.questions.map((question) => ({ ...question, assessmentSetId: set.id }));
    await this.questions.save(questions);
    return this.sets.findOne({ where: { id: set.id }, relations: ['questions'] });
  }

  findPublished(level?: LearningLevel) {
    return this.courses.find({
      where: { status: CourseStatus.Approved, ...(level ? { level } : {}) },
      relations: ['trainer', 'videos'],
      order: { createdAt: 'DESC' },
    });
  }

  findForAdmin() {
    return this.courses.find({ relations: ['trainer', 'videos'], order: { createdAt: 'DESC' } });
  }

  async enroll(courseId: string, learner: User) {
    if (learner.role !== Role.Learner) throw new ForbiddenException('Only learners can enroll');
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course || course.status !== CourseStatus.Approved) throw new NotFoundException('Published course not found');
    const existing = await this.enrollments.findOne({ where: { courseId, learnerId: learner.id } });
    if (existing) return existing;
    return this.enrollments.save({
      courseId,
      learnerId: learner.id,
      unlockedVideoPosition: 1,
      status: EnrollmentStatus.Active,
    });
  }

  getEnrollment(enrollmentId: string) {
    return this.enrollments.findOne({ where: { id: enrollmentId }, relations: ['course', 'learner'] });
  }

  async unlockNext(enrollmentId: string, afterVideoPosition: number) {
    const enrollment = await this.enrollments.findOne({ where: { id: enrollmentId }, relations: ['course'] });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const totalVideos = await this.videos.count({ where: { courseId: enrollment.courseId } });
    enrollment.unlockedVideoPosition = Math.max(enrollment.unlockedVideoPosition, Math.min(afterVideoPosition + 1, totalVideos));
    if (afterVideoPosition >= totalVideos) {
      enrollment.status = EnrollmentStatus.Completed;
      enrollment.completedAt = new Date();
    }
    return this.enrollments.save(enrollment);
  }

  async requireVideoUnlocked(enrollmentId: string, videoPosition: number) {
    const enrollment = await this.enrollments.findOne({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (videoPosition > enrollment.unlockedVideoPosition) {
      throw new ForbiddenException('This video is locked until previous progressive tests are passed');
    }
    return enrollment;
  }

  async getProgress(enrollmentId: string) {
    const enrollment = await this.enrollments.findOne({ where: { id: enrollmentId }, relations: ['course'] });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const videos = await this.videos.find({ where: { courseId: enrollment.courseId }, order: { position: 'ASC' } });
    return {
      enrollment,
      videos: videos.map((video) => ({
        ...video,
        locked: video.position > enrollment.unlockedVideoPosition,
      })),
    };
  }

  async getVideosThrough(courseId: string, position: number) {
    return this.videos.find({ where: { courseId, position: In(Array.from({ length: position }, (_, i) => i + 1)) } });
  }

  private async requireTrainerCourse(courseId: string, trainer: User) {
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.trainerId !== trainer.id && trainer.role !== Role.Admin) throw new ForbiddenException();
    return course;
  }
}
