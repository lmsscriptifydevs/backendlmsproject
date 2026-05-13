import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, User } from '../../database/entities';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private certificates: CertificatesService) {}

  @Get('mine')
  @Roles(Role.Learner)
  mine(@CurrentUser() user: User) {
    return this.certificates.findByLearner(user.id);
  }

  @Get('learners/:learnerId')
  @Roles(Role.Admin, Role.InstituteHead)
  byLearner(@Param('learnerId') learnerId: string) {
    return this.certificates.findByLearner(learnerId);
  }
}
