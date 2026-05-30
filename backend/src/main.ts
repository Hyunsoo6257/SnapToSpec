import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiConfigService } from '@snaptospec/utils';

import { AppModule } from './app.module';
import { OpenApi } from './open-api';
import { GlobalExceptionFilter } from './shared/filter/global-exception.filter';
import WinstonLogger from './winston-logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: WinstonLogger.getLogger(),
  });
  const configService = app.get(ConfigService);
  const apiConfigService = app.get(ApiConfigService);

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
    .useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
    .useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));

  new OpenApi(apiConfigService).handler(app);

  await app.listen(apiConfigService.applicationPort);

  process.on('SIGTERM', async () => {
    await app.close();
  });
}

void bootstrap();

