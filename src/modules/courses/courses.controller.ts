import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourseStatus, LearningLevel, QuestionType, Role, User } from '../../database/entities';
import { CoursesService } from './courses.service';

class CreateCourseDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsEnum(LearningLevel) level: LearningLevel;
}

class AddVideoDto {
  @IsString() title: string;
  @IsInt() position: number;
  @IsUrl({ require_tld: false }) videoUrl: string;
  @IsOptional() @IsString() summary?: string;
}

class QuestionDto {
  @IsEnum(QuestionType) type: QuestionType;
  @IsString() prompt: string;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() correctAnswer?: unknown;
  @IsOptional() @IsInt() points?: number;
}

class AddSetDto {
  @IsString() title: string;
  @IsInt() version: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

class ReviewDto {
  @IsEnum(CourseStatus) status: CourseStatus.Approved | CourseStatus.Rejected;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Post()
  @Roles(Role.Trainer)
  create(@CurrentUser() user: User, @Body() dto: CreateCourseDto) {
    return this.courses.createCourse(user, dto);
  }

  @Post(':id/submit-review')
  @Roles(Role.Trainer)
  submitReview(@Param('id') id: string, @CurrentUser() user: User) {
    return this.courses.submitForReview(id, user);
  }

  @Patch(':id/admin-review')
  @Roles(Role.Admin)
  adminReview(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.courses.adminReview(id, dto.status, dto.notes);
  }

  @Post(':id/videos')
  @Roles(Role.Trainer)
  addVideo(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: AddVideoDto) {
    return this.courses.addVideo(id, user, dto);
  }

  @Post('videos/:videoId/assessment-sets')
  @Roles(Role.Trainer)
  addAssessmentSet(@Param('videoId') videoId: string, @CurrentUser() user: User, @Body() dto: AddSetDto) {
    return this.courses.addAssessmentSet(videoId, user, dto);
  }

  @Get('published')
  @Roles(Role.Admin, Role.Trainer, Role.Learner, Role.InstituteHead)
  published(@Query('level') level?: LearningLevel) {
    return this.courses.findPublished(level);
  }

  @Get('admin')
  @Roles(Role.Admin)
  adminList() {
    return this.courses.findForAdmin();
  }

  @Post(':id/enroll')
  @Roles(Role.Learner)
  enroll(@Param('id') id: string, @CurrentUser() user: User) {
    return this.courses.enroll(id, user);
  }

  @Get('enrollments/:id/progress')
  @Roles(Role.Learner, Role.Trainer, Role.Admin, Role.InstituteHead)
  progress(@Param('id') id: string) {
    return this.courses.getProgress(id);
  }
}
