import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, Course, Enrollment, Institution, Role, User } from '../../database/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Institution) private institutions: Repository<Institution>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Certificate) private certificates: Repository<Certificate>,
  ) {}

  async overview() {
    const [learners, trainers, institutes, courses, enrollments, certificates] = await Promise.all([
      this.users.count({ where: { role: Role.Learner } }),
      this.users.count({ where: { role: Role.Trainer } }),
      this.institutions.count(),
      this.courses.count(),
      this.enrollments.count(),
      this.certificates.count(),
    ]);
    return { learners, trainers, institutes, courses, enrollments, certificates };
  }
}
