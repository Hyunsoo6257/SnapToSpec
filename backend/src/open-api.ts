import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupOpenApi(
  app: INestApplication,
  configService: ConfigService,
): void {
  if (configService.get<string>('NODE_ENV') === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('SnapToSpec API')
    .setDescription('Convert design screenshots into spec overlay images.')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger', app, document);
}
