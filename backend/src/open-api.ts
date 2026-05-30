import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiConfigService } from '@snaptospec/utils';

export class OpenApi {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  handler(app: INestApplication): void {
    if (this.apiConfigService.isProd) return;

    const config = new DocumentBuilder()
      .setTitle('SnapToSpec API')
      .setDescription('Convert design screenshots into spec overlay images.')
      .setVersion('0.1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/swagger', app, document);
  }
}
