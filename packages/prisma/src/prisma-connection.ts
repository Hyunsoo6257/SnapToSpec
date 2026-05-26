import { PrismaClient } from '@prisma/client';
import { INestApplication, Logger, OnModuleInit } from '@nestjs/common';

export default class PrismaConnection
  extends PrismaClient
  implements OnModuleInit
{
  private readonly logger = new Logger('DATABASE');

  constructor() {
    super({
      log: [{ emit: 'event', level: 'query' }],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connection established');
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
