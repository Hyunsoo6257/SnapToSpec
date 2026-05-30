# Catch-up 2 — SpecExtraction Module + Claude API Integration

## Goal
Complete Week 2 Day 1 and Week 2 Day 2 in a single session.
Build the full spec extraction pipeline: POST /api/v1/spec/extract → Claude Vision API → JSON spec.

## Context
- catchup-1 (global infra + FileModule) already exists
- Use Anthropic SDK (`@anthropic-ai/sdk`) — already listed in CLAUDE.md tech stack
- Model: `claude-sonnet-4-6`, temperature: 0.2
- Strip code fences from Claude response before JSON.parse (Claude sometimes wraps JSON in ```json blocks)
- Follow all CLAUDE.md rules strictly

---

## Part 1: SpecExtractionModule Skeleton (Week 2 Day 1)

### Files to Create

#### backend/src/module/spec-extraction/dto/base.dto.ts
Define `SpecStylesDto` and `SpecElementDto` using class-validator + GenericAssignDto.

`SpecStylesDto` fields (all `@IsString() @IsOptional()`, value can be null):
- backgroundColor, color, fontSize, fontWeight, borderRadius, padding, margin, border, gap

`SpecElementDto` fields:
- `id`: `@IsString() @IsNotEmpty()`
- `type`: `@IsEnum(['button','text','input','image','card','container','icon','divider'])`
- `label`: `@IsString() @IsOptional()`
- `position`: nested object with `x`, `y`, `width`, `height` all `@IsNumber()`
- `styles`: `@ValidateNested() @Type(() => SpecStylesDto)`

Both DTOs extend `GenericAssignDto<T>` from `@snaptospec/utils`.

#### backend/src/module/spec-extraction/dto/extract-request.dto.ts
```typescript
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';

export class ExtractRequestDto extends GenericAssignDto<ExtractRequestDto> {
  @IsUrl()
  @IsString()
  @ApiProperty({ description: 'Public URL of the screenshot in Supabase Storage' })
  imageUrl: string;
}
```

#### backend/src/module/spec-extraction/dto/extract-result.dto.ts
```typescript
import { ValidateNested } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';
import { SpecElementDto } from './base.dto';

export class ExtractResultDto extends GenericAssignDto<ExtractResultDto> {
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => SpecElementDto)
  @ApiProperty({ type: [SpecElementDto] })
  elements: SpecElementDto[];
}
```

---

## Part 2: Claude API Integration (Week 2 Day 2)

### backend/src/module/spec-extraction/spec-extraction.service.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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

    let rawText = content.text.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      this.logger.error(`Claude returned non-JSON: ${rawText.slice(0, 200)}`);
      throw new InternalServerErrorException('Claude returned invalid JSON');
    }

    return new ExtractResultDto(parsed as ExtractResultDto);
  }
}
```

### backend/src/module/spec-extraction/spec-extraction.controller.ts
```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SpecExtractionService } from './spec-extraction.service';
import { ExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResultDto } from './dto/extract-result.dto';

@ApiTags('Spec Extraction')
@Controller('spec')
export class SpecExtractionController {
  constructor(
    private readonly specExtractionService: SpecExtractionService,
  ) {}

  @Post('extract')
  extract(@Body() dto: ExtractRequestDto): Promise<ExtractResultDto> {
    return this.specExtractionService.extract(dto);
  }
}
```

### backend/src/module/spec-extraction/spec-extraction.module.ts
```typescript
import { Module } from '@nestjs/common';
import { SpecExtractionController } from './spec-extraction.controller';
import { SpecExtractionService } from './spec-extraction.service';

@Module({
  controllers: [SpecExtractionController],
  providers: [SpecExtractionService],
})
export class SpecExtractionModule {}
```

### Register SpecExtractionModule in app.module.ts
Add `SpecExtractionModule` to the `imports` array in AppModule.

### Dependencies to add to backend/package.json
```json
"@anthropic-ai/sdk": "^0.27.0"
```

---

## Completion Criteria
- [ ] `POST /api/v1/spec/extract` with `{ "imageUrl": "https://picsum.photos/400/300" }` calls Claude Vision API and returns real JSON spec
- [ ] Response contains `elements` array with `id`, `type`, `label`, `position`, `styles`
- [ ] Claude JSON code block stripping applied before `JSON.parse()` (handles ```json fences)
- [ ] If Claude returns invalid JSON → 500 with clear error message logged
- [ ] `ANTHROPIC_API_KEY` read via `ConfigService.getOrThrow()` — never hardcoded
- [ ] `SpecExtractionService` uses `this.logger` (not console.log)
- [ ] All DTOs extend `GenericAssignDto<T>` and use class-validator decorators
- [ ] No `any` type anywhere

## Commit Message
```
feat: add spec-extraction module with Claude Vision API integration
```

## Forbidden
- Never hardcode `ANTHROPIC_API_KEY`
- Never use `any` type
- Never use `console.log`
- Never use `@moonward-apps/*` packages
