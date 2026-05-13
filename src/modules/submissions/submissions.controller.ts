import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReviewDecision, Role, User } from '../../database/entities';
import { SubmissionsService } from './submissions.service';

class SubmitHomeworkDto {
  @IsString() enrollmentId: string;
  @IsString() videoId: string;
  @IsOptional() @IsUrl({ require_tld: false }) fileUrl?: string;
  @IsOptional() @IsString() textAnswer?: string;
}

class ReviewSubmissionDto {
  @IsEnum(ReviewDecision) decision: ReviewDecision;
  @IsOptional() @IsString() remarks?: string;
}

@ApiTags('submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissions: SubmissionsService) {}

  @Post('homework')
  @Roles(Role.Learner)
  submit(@CurrentUser() user: User, @Body() dto: SubmitHomeworkDto) {
    return this.submissions.submit(user, dto);
  }

  @Get('trainer')
  @Roles(Role.Trainer)
  trainerList(@CurrentUser() user: User) {
    return this.submissions.listForTrainer(user.id);
  }

  @Patch(':id/review')
  @Roles(Role.Trainer)
  review(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ReviewSubmissionDto) {
    return this.submissions.review(user, id, dto.decision, dto.remarks);
  }
}
