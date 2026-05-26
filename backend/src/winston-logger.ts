import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export default abstract class WinstonLogger {
  static getLogger(): LoggerService {
    return WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `[${String(timestamp)}] [${String(context ?? 'App')}] ${level}: ${String(message)}`;
            }),
          ),
        }),
      ],
    });
  }
}
