import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { AssessmentSet, Enrollment, Question, TestAttempt, VideoLesson } from '../../database/entities';
import { CertificatesService } from '../certificates/certificates.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(AssessmentSet) private sets: Repository<AssessmentSet>,
    @InjectRepository(Question) private questions: Repository<Question>,
    @InjectRepository(TestAttempt) private attempts: Repository<TestAttempt>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(VideoLesson) private videos: Repository<VideoLesson>,
    private courses: CoursesService,
    private certificates: CertificatesService,
  ) {}

  async buildProgressiveTest(enrollmentId: string, afterVideoPosition: number) {
    const enrollment = await this.enrollments.findOne({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (afterVideoPosition > enrollment.unlockedVideoPosition) {
      throw new ForbiddenException('Cannot test a locked video');
    }

    const videos = await this.videos.find({
      where: { courseId: enrollment.courseId, position: LessThanOrEqual(afterVideoPosition) },
      order: { position: 'ASC' },
    });
    if (videos.length !== afterVideoPosition) {
      throw new BadRequestException('Progressive test requires all prior videos');
    }

    const previousAttempts = await this.attempts.find({
      where: { enrollmentId, afterVideoPosition },
      order: { createdAt: 'DESC' },
    });
    const usedSetIds = new Set(previousAttempts.flatMap((attempt) => attempt.assessmentSetIds));

    const selectedSets: AssessmentSet[] = [];
    for (const video of videos) {
      const activeSets = await this.sets.find({ where: { videoId: video.id, active: true }, order: { version: 'ASC' } });
      if (!activeSets.length) throw new BadRequestException(`Video ${video.position} has no assessment sets`);
      const unused = activeSets.find((set) => !usedSetIds.has(set.id));
      selectedSets.push(unused ?? activeSets[previousAttempts.length % activeSets.length]);
    }

    const selectedQuestions = await this.questions.find({ where: { assessmentSetId: In(selectedSets.map((set) => set.id)) } });
    return {
      enrollmentId,
      afterVideoPosition,
      assessmentSetIds: selectedSets.map((set) => set.id),
      questions: selectedQuestions.map(({ correctAnswer: _hidden, ...question }) => question),
    };
  }

  async submitProgressiveTest(
    enrollmentId: string,
    afterVideoPosition: number,
    assessmentSetIds: string[],
    answers: Record<string, unknown>,
  ) {
    const enrollment = await this.enrollments.findOne({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const questions = await this.questions
      .createQueryBuilder('question')
      .addSelect('question.correctAnswer')
      .where('question.assessmentSetId IN (:...assessmentSetIds)', { assessmentSetIds })
      .getMany();

    const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
    const score = questions.reduce((sum, question) => {
      const expected = JSON.stringify(question.correctAnswer ?? null);
      const actual = JSON.stringify(answers[question.id] ?? null);
      return expected === actual ? sum + question.points : sum;
    }, 0);
    const passed = maxScore > 0 && score / maxScore >= 0.7;

    const attempt = await this.attempts.save({
      enrollmentId,
      afterVideoPosition,
      assessmentSetIds,
      answers,
      score,
      maxScore,
      passed,
    });

    if (passed) {
      const updated = await this.courses.unlockNext(enrollmentId, afterVideoPosition);
      const totalVideos = await this.videos.count({ where: { courseId: enrollment.courseId } });
      if (afterVideoPosition >= totalVideos) {
        await this.certificates.issueCertificate(updated.learnerId, updated.courseId);
      }
    }

    return attempt;
  }
}
