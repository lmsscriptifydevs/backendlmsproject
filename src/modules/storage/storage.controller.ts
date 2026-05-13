import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

class UploadUrlDto {
  @IsIn(['videos', 'homework', 'logos', 'reports']) folder: 'videos' | 'homework' | 'logos' | 'reports';
  @IsString() contentType: string;
}

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('upload-url')
  uploadUrl(@Body() dto: UploadUrlDto) {
    return this.storage.createUploadUrl(dto.folder, dto.contentType);
  }
}
