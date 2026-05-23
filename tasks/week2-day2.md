# Week 2 Day 2 — Claude API Integration

## Goal
Replace the mock response in SpecExtractionService with a real Claude Vision API call.
`POST /api/v1/spec/extract { imageUrl }` → Claude analyzes the image → returns real JSON spec.

## Context
- SpecExtractionModule skeleton from Day 1 exists
- Use Anthropic SDK (`@anthropic-ai/sdk`)
- Pass imageUrl to Claude Vision API (image_url source type)
- Use `claude-sonnet-4-6` model with temperature 0.2
- Parse Claude's JSON response into ExtractResultDto
- Follow all CLAUDE.md rules

## Changes to Make

### 1. Add Anthropic SDK to backend/package.json
```json
"@anthropic-ai/sdk": "^0.27.0"
```

### 2. Update spec-extraction.service.ts

Replace mock with real Claude API call:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResultDto } from './dto/extract-result.dto';

@Injectable()
export class SpecExtractionService {
  private readonly logger = new Logger(SpecExtractionService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async extract(dto: ExtractRequestDto): Promise<ExtractResultDto> {
    this.logger.log(`Extracting spec from image: ${dto.imageUrl}`);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        temperature: 0.2,
        system: `You only speak JSON. Do not write text that is not JSON.
You are a UI spec extractor. Analyze the screenshot and return every visible UI element with exact specs.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: dto.imageUrl,
                },
              },
              {
                type: 'text',
                text: `Analyze this UI screenshot and extract all visible elements.
Return ONLY this JSON structure:

{
  "elements": [
    {
      "id": "unique-slug-id",
      "type": "button|text|input|image|card|container|icon|divider",
      "label": "visible text or null",
      "position": { "x": 0, "y": 0, "width": 0, "height": 0 },
      "styles": {
        "backgroundColor": "#HEX or transparent or null",
        "color": "#HEX or null",
        "fontSize": "Npx or null",
        "fontWeight": "400|500|600|700|800 or null",
        "borderRadius": "Npx or null",
        "padding": "Npx Npx Npx Npx or null",
        "margin": "Npx Npx Npx Npx or null",
        "border": "Npx solid #HEX or none or null",
        "gap": "Npx or null"
      }
    }
  ]
}

Rules:
- All colors must be exact HEX codes. If unsure → null (never guess)
- All sizes in px
- Position values relative to image top-left
- If unsure about any value → null`,
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new InternalServerErrorException('Unexpected Claude response type');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content.text);
      } catch {
        this.logger.error(`Claude returned non-JSON: ${content.text.slice(0, 200)}`);
        throw new InternalServerErrorException('Claude returned invalid JSON');
      }

      return new ExtractResultDto(parsed as ExtractResultDto);
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Claude API call failed', error);
      throw new InternalServerErrorException('Spec extraction failed');
    }
  }
}
```

## Completion Criteria
- [ ] `POST /api/v1/spec/extract { "imageUrl": "..." }` calls real Claude API
- [ ] Returns JSON with `elements` array (real data from image, not mock)
- [ ] If Claude returns invalid JSON → 500 with clear error message
- [ ] If Claude API key is missing → server refuses to start (Joi validation)
- [ ] No hardcoded API keys (uses ConfigService)
- [ ] No `any` type
- [ ] No `console.log`

## Commit Message
```
feat: integrate Claude Vision API for spec extraction
```

## Forbidden
- Never hardcode `ANTHROPIC_API_KEY`
- Never use `any` type
- Never use `console.log`
- Never use `@moonward-apps/*` packages
