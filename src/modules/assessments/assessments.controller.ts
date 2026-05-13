import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsObject } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../database/entities';
import { AssessmentsService } from './assessments.service';

class SubmitTestDto {
  @IsArray()
  assessmentSetIds: string[];

  @IsObject()
  answers: Record<string, unknown>;
}

@ApiTags('assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private assessments: AssessmentsService) {}

  @Get('enrollments/:enrollmentId/after-video/:position')
  @Roles(Role.Learner)
  build(@Param('enrollmentId') enrollmentId: string, @Param('position', ParseIntPipe) position: number) {
    return this.assessments.buildProgressiveTest(enrollmentId, position);
  }

  @Post('enrollments/:enrollmentId/after-video/:position/submit')
  @Roles(Role.Learner)
  submit(
    @Param('enrollmentId') enrollmentId: string,
    @Param('position', ParseIntPipe) position: number,
    @Body() dto: SubmitTestDto,
  ) {
    return this.assessments.submitProgressiveTest(enrollmentId, position, dto.assessmentSetIds, dto.answers);
  }
}
