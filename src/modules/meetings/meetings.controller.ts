import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, User } from '../../database/entities';
import { MeetingsService } from './meetings.service';

class CreateMeetingDto {
  @IsString() courseId: string;
  @IsDateString() startsAt: string;
  @IsIn(['zoom', 'google_meet']) provider: 'zoom' | 'google_meet';
  @IsUrl({ require_tld: false }) meetingUrl: string;
  @IsOptional() @IsString() agenda?: string;
}

@ApiTags('meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private meetings: MeetingsService) {}

  @Post()
  @Roles(Role.Trainer)
  create(@CurrentUser() user: User, @Body() dto: CreateMeetingDto) {
    return this.meetings.create({ ...dto, trainerId: user.id, startsAt: new Date(dto.startsAt) });
  }

  @Get('courses/:courseId')
  @Roles(Role.Admin, Role.Trainer, Role.Learner, Role.InstituteHead)
  byCourse(@Param('courseId') courseId: string) {
    return this.meetings.byCourse(courseId);
  }
}
