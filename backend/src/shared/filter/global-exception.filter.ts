import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      message = this.extractMessage(exception.getResponse(), message);
    } else if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        httpStatus = HttpStatus.CONFLICT;
        message = 'Duplicate entry';
      } else if (exception.code === 'P2025') {
        httpStatus = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      } else {
        this.logger.error(
          `Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );
      }
    } else if (exception instanceof PrismaClientValidationError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = { statusCode: httpStatus, message };
    httpAdapter.reply(ctx.getResponse(), body, httpStatus);
  }

  private extractMessage(response: string | object, fallback: string): string {
    if (typeof response === 'string') {
      return response;
    }
    if (
      response !== null &&
      typeof response === 'object' &&
      'message' in response
    ) {
      const candidate = (response as { message: unknown }).message;
      if (typeof candidate === 'string') return candidate;
      if (Array.isArray(candidate)) return candidate.join(', ');
    }
    return fallback;
  }
}
