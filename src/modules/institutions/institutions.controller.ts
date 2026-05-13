import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUrl } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LearningLevel, Role } from '../../database/entities';
import { InstitutionsService } from './institutions.service';

class CreateInstitutionDto {
  @IsString() name: string;
  @IsEnum(LearningLevel) level: LearningLevel;
  @IsInt() studentCount: number;
  @IsOptional() @IsString() portalSlug?: string;
  @IsOptional() @IsUrl({ require_tld: false }) logoUrl?: string;
}

class LogoDto {
  @IsUrl({ require_tld: false }) logoUrl: string;
}

class CreateGroupDto {
  @IsString() name: string;
  @IsIn(['institute', 'class', 'trainer_head_room']) type: 'institute' | 'class' | 'trainer_head_room';
}

@ApiTags('institutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(private institutions: InstitutionsService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutions.create(dto);
  }

  @Get()
  @Roles(Role.Admin)
  list() {
    return this.institutions.list();
  }

  @Get('pricing')
  @Roles(Role.Admin, Role.InstituteHead)
  pricing(@Query('level') level?: LearningLevel) {
    return this.institutions.pricing(level);
  }

  @Patch(':id/logo')
  @Roles(Role.InstituteHead, Role.Admin)
  logo(@Param('id') id: string, @Body() dto: LogoDto) {
    return this.institutions.uploadLogo(id, dto.logoUrl);
  }

  @Get(':id/students')
  @Roles(Role.InstituteHead, Role.Admin)
  students(@Param('id') id: string) {
    return this.institutions.students(id);
  }

  @Post(':id/groups')
  @Roles(Role.InstituteHead)
  createGroup(@Param('id') id: string, @Body() dto: CreateGroupDto) {
    return this.institutions.createGroup(id, dto.name, dto.type);
  }
}
