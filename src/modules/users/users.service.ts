import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, User } from '../../database/entities';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  findAll(role?: Role) {
    return this.users.find({ where: role ? { role } : {}, relations: ['institution'], order: { createdAt: 'DESC' } });
  }

  updateMarketplaceAccess(userId: string, enabled: boolean) {
    return this.users.update(userId, { marketplaceGigAccess: enabled });
  }
}
