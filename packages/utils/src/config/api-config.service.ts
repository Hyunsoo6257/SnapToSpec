import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.configService.getOrThrow<string>('NODE_ENV') === 'development';
  }

  get isProd(): boolean {
    return this.configService.getOrThrow<string>('NODE_ENV') === 'production';
  }

  get applicationPort(): number {
    return Number(this.configService.get('APPLICATION_PORT') ?? 3000);
  }

  get projectName(): string {
    return this.configService.getOrThrow<string>('PROJECT_NAME');
  }

  get frontendBaseUrl(): string {
    return this.configService.getOrThrow<string>('FRONTEND_BASE_URL');
  }
}
