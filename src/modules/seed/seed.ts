import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const result = await app.get(SeedService).run();
  console.log(JSON.stringify(result, null, 2));
  await app.close();
}

run();
