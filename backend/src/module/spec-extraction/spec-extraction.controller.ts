import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResultDto } from './dto/extract-result.dto';
import { SpecExtractionService } from './spec-extraction.service';

@ApiTags('Spec Extraction')
@Controller('spec')
export class SpecExtractionController {
  constructor(private readonly specExtractionService: SpecExtractionService) {}

  @Post('extract')
  extract(@Body() dto: ExtractRequestDto): Promise<ExtractResultDto> {
    return this.specExtractionService.extract(dto);
  }
}
