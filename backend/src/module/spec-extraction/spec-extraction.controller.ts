import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpecExtractionService } from './spec-extraction.service';
import { ExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResultDto } from './dto/extract-result.dto';

@ApiTags('Spec Extraction')
@Controller('spec')
export class SpecExtractionController {
  constructor(private readonly specExtractionService: SpecExtractionService) {}

  @Post('extract')
  @ApiOperation({ summary: 'Extract UI spec from screenshot' })
  @ApiBody({ type: ExtractRequestDto })
  @ApiResponse({
    status: 201,
    type: ExtractResultDto,
    description: 'Extracted spec (elements may be empty for images with no UI)',
  })
  @ApiResponse({ status: 400, description: 'Invalid imageUrl' })
  @ApiResponse({ status: 500, description: 'Claude API or parsing error' })
  extract(@Body() dto: ExtractRequestDto): Promise<ExtractResultDto> {
    return this.specExtractionService.extract(dto);
  }
}
