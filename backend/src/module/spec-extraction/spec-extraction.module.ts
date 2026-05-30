import { Module } from '@nestjs/common';
import { SpecExtractionController } from './spec-extraction.controller';
import { SpecExtractionService } from './spec-extraction.service';

@Module({
  controllers: [SpecExtractionController],
  providers: [SpecExtractionService],
})
export class SpecExtractionModule {}
