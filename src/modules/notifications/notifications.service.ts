import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private notifications: Repository<Notification>) {}

  create(userId: string, title: string, body: string) {
    return this.notifications.save({ userId, title, body });
  }

  list(userId: string) {
    return this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
