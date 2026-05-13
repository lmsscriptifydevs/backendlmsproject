import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from '../../database/entities';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
