import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/entities';
import { GroupsService } from './groups.service';

class MessageDto {
  @IsString() body: string;
  @IsOptional() @IsUrl({ require_tld: false }) voiceNoteUrl?: string;
}

class QuestionDto {
  @IsString() trainerId: string;
  @IsString() body: string;
}

@ApiTags('groups-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private groups: GroupsService) {}

  @Post('global/join')
  joinGlobal(@CurrentUser() user: User) {
    return this.groups.joinGlobal(user);
  }

  @Get('mine')
  mine(@CurrentUser() user: User) {
    return this.groups.myGroups(user.id);
  }

  @Post(':groupId/messages')
  send(@CurrentUser() user: User, @Param('groupId') groupId: string, @Body() dto: MessageDto) {
    return this.groups.sendGroupMessage(user, groupId, dto.body, dto.voiceNoteUrl);
  }

  @Get(':groupId/messages')
  messages(@Param('groupId') groupId: string) {
    return this.groups.groupMessages(groupId);
  }

  @Post('questions')
  question(@CurrentUser() user: User, @Body() dto: QuestionDto) {
    return this.groups.sendPrivateQuestion(user, dto.trainerId, dto.body);
  }
}
