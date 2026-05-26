import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ExceptionResponse = (
  ...statuses: number[]
): ReturnType<typeof applyDecorators> => {
  const decorators = statuses.map((status) => ApiResponse({ status }));
  return applyDecorators(...decorators);
};
