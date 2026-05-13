import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum Role {
  Admin = 'admin',
  Trainer = 'trainer',
  Learner = 'learner',
  InstituteHead = 'institute_head',
}

export enum LearnerCategory {
  School = 'school_student',
  College = 'college_student',
  University = 'university_student',
  Individual = 'individual_learner',
}

export enum LearningLevel {
  School = 'school',
  College = 'college',
  University = 'university',
  Individual = 'individual',
}

export enum CourseStatus {
  Draft = 'draft',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum ReviewDecision {
  Pass = 'pass',
  Fail = 'fail',
  Improve = 'improve',
}

export enum EnrollmentStatus {
  Active = 'active',
  Completed = 'completed',
  Suspended = 'suspended',
}

export enum QuestionType {
  Mcq = 'mcq',
  Quiz = 'quiz',
  Summary = 'summary',
  Homework = 'homework',
}

export enum PackageDuration {
  Monthly = 'monthly',
  SixMonths = 'six_months',
  Yearly = 'yearly',
}

@Entity('lms_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'enum', enum: LearnerCategory, nullable: true })
  learnerCategory?: LearnerCategory | null;

  @Column({ type: 'enum', enum: LearningLevel, nullable: true })
  trainerLevel?: LearningLevel | null;

  @Column({ type: 'text', nullable: true })
  portfolio?: string | null;

  @Column({ type: 'text', nullable: true })
  teachingExperience?: string | null;

  @Column({ type: 'text', nullable: true })
  joiningReason?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  institutionId?: string | null;

  @ManyToOne(() => Institution, (institution) => institution.users, { nullable: true })
  @JoinColumn({ name: 'institutionId' })
  institution?: Institution | null;

  @Column({ default: false })
  marketplaceGigAccess: boolean;

  @Column({ default: false })
  globalGroupJoined: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: LearningLevel })
  level: LearningLevel;

  @Column({ default: 0 })
  studentCount: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  portalSlug?: string | null;

  @OneToMany(() => User, (user) => user.institution)
  users: User[];
}

@Entity('pricing_packages')
export class PricingPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LearningLevel })
  level: LearningLevel;

  @Column({ type: 'enum', enum: PackageDuration })
  duration: PackageDuration;

  @Column({ type: 'int' })
  pricePerStudentPkr: number;

  @Column({ type: 'int', default: 30 })
  grapeTaskRevenuePercent: number;

  @Column({ type: 'int', default: 70 })
  trainerRevenuePercent: number;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: LearningLevel })
  level: LearningLevel;

  @Column()
  trainerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'trainerId' })
  trainer: User;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.Draft })
  status: CourseStatus;

  @Column({ type: 'text', nullable: true })
  adminReviewNotes?: string | null;

  @OneToMany(() => VideoLesson, (video) => video.course)
  videos: VideoLesson[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('video_lessons')
@Unique(['courseId', 'position'])
export class VideoLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @ManyToOne(() => Course, (course) => course.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  title: string;

  @Column({ type: 'int' })
  position: number;

  @Column()
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @OneToMany(() => AssessmentSet, (set) => set.video)
  assessmentSets: AssessmentSet[];
}

@Entity('assessment_sets')
export class AssessmentSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  videoId: string;

  @ManyToOne(() => VideoLesson, (video) => video.assessmentSets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'videoId' })
  video: VideoLesson;

  @Column()
  title: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Question, (question) => question.assessmentSet)
  questions: Question[];
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assessmentSetId: string;

  @ManyToOne(() => AssessmentSet, (set) => set.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentSetId' })
  assessmentSet: AssessmentSet;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'json', nullable: true })
  options?: string[] | null;

  @Column({ type: 'json', nullable: true, select: false })
  correctAnswer?: unknown;

  @Column({ type: 'int', default: 1 })
  points: number;
}

@Entity('enrollments')
@Unique(['learnerId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  learnerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'learnerId' })
  learner: User;

  @Column()
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.Active })
  status: EnrollmentStatus;

  @Column({ type: 'int', default: 1 })
  unlockedVideoPosition: number;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date | null;
}

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enrollmentId: string;

  @ManyToOne(() => Enrollment)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column({ type: 'int' })
  afterVideoPosition: number;

  @Column({ type: 'json' })
  assessmentSetIds: string[];

  @Column({ type: 'json' })
  answers: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  maxScore: number;

  @Column({ default: false })
  passed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('homework_submissions')
export class HomeworkSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enrollmentId: string;

  @ManyToOne(() => Enrollment)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column()
  videoId: string;

  @ManyToOne(() => VideoLesson)
  @JoinColumn({ name: 'videoId' })
  video: VideoLesson;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  fileUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  textAnswer?: string | null;

  @Column({ type: 'enum', enum: ReviewDecision, nullable: true })
  trainerDecision?: ReviewDecision | null;

  @Column({ type: 'text', nullable: true })
  trainerRemarks?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  learnerId: string;

  @Column()
  courseId: string;

  @Column()
  badge: string;

  @Column()
  certificateUrl: string;

  @Column({ type: 'datetime' })
  certificationDate: Date;
}

@Entity('student_reports')
export class StudentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  learnerId: string;

  @Column()
  trainerId: string;

  @Column()
  institutionId: string;

  @Column()
  courseId: string;

  @Column({ type: 'text' })
  remarks: string;

  @Column({ type: 'json' })
  progressSnapshot: Record<string, unknown>;

  @Column()
  reportUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 64 })
  type: 'global' | 'institute' | 'class' | 'trainer_head_room';

  @Column({ type: 'varchar', length: 36, nullable: true })
  institutionId?: string | null;
}

@Entity('group_members')
@Unique(['groupId', 'userId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  userId: string;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  groupId?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  recipientId?: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  voiceNoteUrl?: string | null;

  @Column({ default: false })
  reactionsOnly: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trainerId: string;

  @Column()
  courseId: string;

  @Column({ type: 'datetime' })
  startsAt: Date;

  @Column({ type: 'varchar', length: 32 })
  provider: 'zoom' | 'google_meet';

  @Column()
  meetingUrl: string;

  @Column({ type: 'text', nullable: true })
  agenda?: string | null;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

export const ENTITIES = [
  User,
  Institution,
  PricingPackage,
  Course,
  VideoLesson,
  AssessmentSet,
  Question,
  Enrollment,
  TestAttempt,
  HomeworkSubmission,
  Certificate,
  StudentReport,
  Group,
  GroupMember,
  Message,
  Meeting,
  Notification,
];
