import { Injectable } from '@nestjs/common';
import { PrismaConnection, PrismaProvider } from '@snaptospec/prisma';

@Injectable()
export default abstract class GenericService {
  protected readonly prisma: PrismaConnection = PrismaProvider.getConnection();
}
