import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');
  app.use(helmet());

  const storageDir = process.env.STORAGE_DIR ?? path.join(process.cwd(), 'storage', 'uploads');
  app.use('/storage/uploads', express.static(storageDir));

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: false,
  });

  await app.listen(process.env.BACKEND_PORT ?? process.env.PORT ?? 3000);
}
bootstrap();
