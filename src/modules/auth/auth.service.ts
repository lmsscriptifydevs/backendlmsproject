import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LearnerCategory, LearningLevel, Role, User } from '../../database/entities';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  learnerCategory?: LearnerCategory;
  trainerLevel?: LearningLevel;
  portfolio?: string;
  teachingExperience?: string;
  joiningReason?: string;
  institutionId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.users.findOne({ where: { email: input.email } });
    if (existing) throw new BadRequestException('Email is already registered');

    if (input.role === Role.Learner && !input.learnerCategory) {
      throw new BadRequestException('Learner category is required');
    }
    if (input.role === Role.Trainer && !input.trainerLevel) {
      throw new BadRequestException('Trainer level is required');
    }

    const user = await this.users.save({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      learnerCategory: input.learnerCategory,
      trainerLevel: input.trainerLevel,
      portfolio: input.portfolio,
      teachingExperience: input.teachingExperience,
      joiningReason: input.joiningReason,
      institutionId: input.institutionId,
    });

    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user);
  }

  issueToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: this.safeUser(user),
    };
  }

  safeUser(user: User) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
