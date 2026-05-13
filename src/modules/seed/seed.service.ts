import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import {
  AssessmentSet,
  Course,
  CourseStatus,
  Institution,
  LearnerCategory,
  LearningLevel,
  PackageDuration,
  PricingPackage,
  Question,
  QuestionType,
  Role,
  User,
  VideoLesson,
} from '../../database/entities';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Institution) private institutions: Repository<Institution>,
    @InjectRepository(PricingPackage) private packages: Repository<PricingPackage>,
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(VideoLesson) private videos: Repository<VideoLesson>,
    @InjectRepository(AssessmentSet) private sets: Repository<AssessmentSet>,
    @InjectRepository(Question) private questions: Repository<Question>,
  ) {}

  async run() {
    await this.seedPricing();
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const admin = await this.upsertUser('admin@grapetask.com', {
      name: 'GrapeTask Admin',
      passwordHash,
      role: Role.Admin,
    });
    const trainer = await this.upsertUser('trainer@grapetask.com', {
      name: 'Demo Trainer',
      passwordHash,
      role: Role.Trainer,
      trainerLevel: LearningLevel.University,
      portfolio: 'https://grapetask.com/demo-trainer',
      teachingExperience: '5 years of web development instruction',
      joiningReason: 'To train learners for marketplace-ready earning skills',
    });
    const institute = await this.institutions.save({
      name: 'Demo University Portal',
      level: LearningLevel.University,
      studentCount: 500,
      portalSlug: 'demo-university',
    });
    await this.upsertUser('learner@grapetask.com', {
      name: 'Demo Learner',
      passwordHash,
      role: Role.Learner,
      learnerCategory: LearnerCategory.University,
      institutionId: institute.id,
    });
    await this.upsertUser('head@grapetask.com', {
      name: 'Demo Institute Head',
      passwordHash,
      role: Role.InstituteHead,
      institutionId: institute.id,
    });
    await this.seedCourse(trainer.id);
    return { admin, trainer, institute, password: 'Password123!' };
  }

  private async seedPricing() {
    const rows = [
      [LearningLevel.School, PackageDuration.Monthly, 200],
      [LearningLevel.School, PackageDuration.SixMonths, 150],
      [LearningLevel.School, PackageDuration.Yearly, 120],
      [LearningLevel.College, PackageDuration.Monthly, 300],
      [LearningLevel.College, PackageDuration.SixMonths, 240],
      [LearningLevel.College, PackageDuration.Yearly, 200],
      [LearningLevel.University, PackageDuration.Monthly, 500],
      [LearningLevel.University, PackageDuration.SixMonths, 400],
      [LearningLevel.University, PackageDuration.Yearly, 350],
    ] as const;
    for (const [level, duration, pricePerStudentPkr] of rows) {
      const exists = await this.packages.findOne({ where: { level, duration } });
      if (!exists) await this.packages.save({ level, duration, pricePerStudentPkr });
    }
  }

  private async upsertUser(email: string, values: Partial<User>) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) return existing;
    return this.users.save({ ...values, email });
  }

  private async seedCourse(trainerId: string) {
    const existing = await this.courses.findOne({ where: { title: 'Professional Web Development' } });
    if (existing) return existing;
    const course = await this.courses.save({
      title: 'Professional Web Development',
      description: 'University-level path for marketplace-ready web development skills.',
      level: LearningLevel.University,
      trainerId,
      status: CourseStatus.Approved,
    });
    for (let position = 1; position <= 3; position += 1) {
      const video = await this.videos.save({
        courseId: course.id,
        title: `Video ${position}: Web Development Skill ${position}`,
        position,
        videoUrl: `https://cdn.grapetask.com/demo/video-${position}.mp4`,
        summary: `Summary for video ${position}`,
      });
      for (let version = 1; version <= 2; version += 1) {
        const set = await this.sets.save({ videoId: video.id, title: `Set ${version}`, version });
        await this.questions.save([
          {
            assessmentSetId: set.id,
            type: QuestionType.Mcq,
            prompt: `Video ${position} MCQ set ${version}: choose the professional answer`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            points: 5,
          },
          {
            assessmentSetId: set.id,
            type: QuestionType.Quiz,
            prompt: `Video ${position} quiz set ${version}`,
            correctAnswer: 'marketplace-ready',
            points: 5,
          },
        ]);
      }
    }
    return course;
  }
}
