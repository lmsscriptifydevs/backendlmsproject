import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from '../../database/entities';

@Injectable()
export class MeetingsService {
  constructor(@InjectRepository(Meeting) private meetings: Repository<Meeting>) {}

  create(input: Partial<Meeting>) {
    return this.meetings.save(input);
  }

  byCourse(courseId: string) {
    return this.meetings.find({ where: { courseId }, order: { startsAt: 'ASC' } });
  }
}
