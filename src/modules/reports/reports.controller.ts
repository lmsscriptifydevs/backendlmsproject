import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, User } from '../../database/entities';
import { ReportsService } from './reports.service';

class CreateReportDto {
  @IsString() learnerId: string;
  @IsString() institutionId: string;
  @IsString() courseId: string;
  @IsString() remarks: string;
}

class EmailReportDto {
  @IsEmail() to: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  @Roles(Role.Trainer)
  create(@CurrentUser() trainer: User, @Body() dto: CreateReportDto) {
    return this.reports.create({ ...dto, trainerId: trainer.id });
  }

  @Get('institutions/:institutionId')
  @Roles(Role.InstituteHead, Role.Admin)
  byInstitution(@Param('institutionId') institutionId: string) {
    return this.reports.institutionReports(institutionId);
  }

  @Post(':id/email')
  @Roles(Role.InstituteHead, Role.Admin)
  email(@Param('id') id: string, @Body() dto: EmailReportDto) {
    return this.reports.emailReport(id, dto.to);
  }
}
