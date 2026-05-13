import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupMember, Message, Role, User } from '../../database/entities';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private groups: Repository<Group>,
    @InjectRepository(GroupMember) private members: Repository<GroupMember>,
    @InjectRepository(Message) private messages: Repository<Message>,
  ) {}

  async joinGlobal(user: User) {
    let group = await this.groups.findOne({ where: { type: 'global' } });
    group ??= await this.groups.save({ name: 'Global GrapeTask LMS Group', type: 'global' });
    const existing = await this.members.findOne({ where: { groupId: group.id, userId: user.id } });
    if (!existing) await this.members.save({ groupId: group.id, userId: user.id });
    return group;
  }

  myGroups(userId: string) {
    return this.groups
      .createQueryBuilder('group')
      .innerJoin(GroupMember, 'member', 'member.groupId = group.id AND member.userId = :userId', { userId })
      .getMany();
  }

  async sendGroupMessage(user: User, groupId: string, body: string, voiceNoteUrl?: string) {
    const group = await this.groups.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.type === 'global' && user.role !== Role.Admin) {
      throw new ForbiddenException('Global group accepts admin messages only; users can react only');
    }
    return this.messages.save({
      senderId: user.id,
      groupId,
      body,
      voiceNoteUrl,
      reactionsOnly: group.type === 'global',
    });
  }

  sendPrivateQuestion(learner: User, trainerId: string, body: string) {
    return this.messages.save({ senderId: learner.id, recipientId: trainerId, body });
  }

  groupMessages(groupId: string) {
    return this.messages.find({ where: { groupId }, order: { createdAt: 'ASC' } });
  }
}
