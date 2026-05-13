import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupMember, Institution, LearningLevel, PricingPackage, User } from '../../database/entities';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution) private institutions: Repository<Institution>,
    @InjectRepository(PricingPackage) private packages: Repository<PricingPackage>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Group) private groups: Repository<Group>,
    @InjectRepository(GroupMember) private members: Repository<GroupMember>,
  ) {}

  create(input: { name: string; level: LearningLevel; studentCount: number; portalSlug?: string; logoUrl?: string }) {
    return this.institutions.save(input);
  }

  list() {
    return this.institutions.find({ relations: ['users'] });
  }

  pricing(level?: LearningLevel) {
    return this.packages.find({ where: level ? { level } : {}, order: { pricePerStudentPkr: 'DESC' } });
  }

  async uploadLogo(institutionId: string, logoUrl: string) {
    await this.institutions.update(institutionId, { logoUrl });
    return this.institutions.findOne({ where: { id: institutionId } });
  }

  students(institutionId: string) {
    return this.users.find({ where: { institutionId } });
  }

  async createGroup(institutionId: string, name: string, type: 'institute' | 'class' | 'trainer_head_room') {
    const institution = await this.institutions.findOne({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    return this.groups.save({ institutionId, name, type });
  }

  addGroupMember(groupId: string, userId: string) {
    return this.members.save({ groupId, userId });
  }
}
