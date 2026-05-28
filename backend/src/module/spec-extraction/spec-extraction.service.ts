import { Injectable, Logger } from '@nestjs/common';

import { ExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResultDto } from './dto/extract-result.dto';

@Injectable()
export class SpecExtractionService {
  private readonly logger = new Logger(SpecExtractionService.name);

  async extract(dto: ExtractRequestDto): Promise<ExtractResultDto> {
    this.logger.log(`Extracting spec from: ${dto.imageUrl}`);

    // TODO: Replace with real Claude API call on Day 2
    // Mock response for testing the pipeline
    return new ExtractResultDto({
      elements: [
        {
          id: 'mock-button',
          type: 'button',
          label: 'Click me',
          position: { x: 100, y: 200, width: 120, height: 40 },
          styles: {
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            padding: '10px 20px 10px 20px',
            margin: null,
            border: 'none',
            gap: null,
          },
        },
      ],
    });
  }
}
