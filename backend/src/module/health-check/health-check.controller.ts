import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthCheckController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
