import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiConfigService } from '@snaptospec/utils';
import * as path from 'path';

import { HealthCheckModule } from './module/health-check/health-check.module';
import ConfigSchemaValidation from './shared/config-schema-validation';
import { LoggerMiddleware } from './shared/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: ConfigSchemaValidation.validationSchema,
      envFilePath: path.join(__dirname, '..', '..', '.env'),
    }),
    HealthCheckModule,
  ],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
