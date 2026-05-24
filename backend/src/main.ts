import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { setupOpenApi } from './open-api';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.getOrThrow<string>('ALLOWED_CORS_ORIGIN').split(','),
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  });

  app
    .setGlobalPrefix('api/v1')
    .useGlobalPipes(
      new ValidationPipe({
        transform: true,
        forbidNonWhitelisted: true,
        whitelist: true,
      }),
    )
    .useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // TODO(week1-day4): wire GlobalExceptionFilter once it is implemented.

  setupOpenApi(app, configService);

  const port = Number(configService.get('APPLICATION_PORT') ?? 3000);
  await app.listen(port);

  process.on('SIGTERM', async () => {
    await app.close();
  });
}

void bootstrap();
