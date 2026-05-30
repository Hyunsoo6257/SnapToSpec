import PrismaConnection from './prisma-connection';

export default abstract class PrismaProvider {
  private static prismaConnection: PrismaConnection;

  static getConnection(): PrismaConnection {
    if (!this.prismaConnection) {
      this.prismaConnection = new PrismaConnection();
    }
    return this.prismaConnection;
  }
}
