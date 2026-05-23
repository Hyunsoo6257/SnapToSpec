# Week 2 Day 1 — SpecExtractionModule Skeleton

## Goal
Create the SpecExtractionModule with controller, service, and DTOs. No Claude API call yet — service returns hardcoded mock data.

## Context
- FileModule from Week 1 Day 5 already exists
- This module will handle `POST /api/v1/spec/extract { imageUrl }` → returns JSON spec
- Claude API integration added on Day 2
- Today: skeleton + DTOs + mock response
- Follow all CLAUDE.md rules

## Spec Data Types (create in backend AND frontend later)

```typescript
// These types match the JSON structure Claude will return
interface SpecStyles {
  backgroundColor: string | null;
  color: string | null;
  fontSize: string | null;
  fontWeight: string | null;
  borderRadius: string | null;
  padding: string | null;
  margin: string | null;
  border: string | null;
  gap: string | null;
}

interface SpecElement {
  id: string;
  type: 'button' | 'text' | 'input' | 'image' | 'card' | 'container' | 'icon' | 'divider';
  label: string | null;
  position: { x: number; y: number; width: number; height: number };
  styles: SpecStyles;
}

interface SpecResult {
  elements: SpecElement[];
}
```

## Files to Create

### backend/src/module/spec-extraction/

```
spec-extraction/
  spec-extraction.module.ts
  spec-extraction.controller.ts
  spec-extraction.service.ts
  dto/
    base.dto.ts            # SpecElement shape
    extract-request.dto.ts # { imageUrl: string }
    extract-result.dto.ts  # { elements: SpecElement[] }
```

#### dto/base.dto.ts
Define SpecStylesDto and SpecElementDto using class-validator + GenericAssignDto:
- All style fields: `@IsString() @IsOptional()` (can be null)
- Position fields: `@IsNumber()` (x, y, width, height)
- `type`: `@IsEnum(['button','text','input','image','card','container','icon','divider'])`
- `id`: `@IsString() @IsNotEmpty()`

#### dto/extract-request.dto.ts
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

#### dto/extract-result.dto.ts
```typescript
// Contains elements: SpecElementDto[]
// Extends GenericAssignDto<ExtractResultDto>
// Uses @ValidateNested({ each: true }) + @Type(() => SpecElementDto)
```

#### spec-extraction.service.ts
```typescript
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
```

#### spec-extraction.controller.ts
```typescript
@ApiTags('Spec Extraction')
@Controller('spec')
export class SpecExtractionController {
  constructor(private readonly specExtractionService: SpecExtractionService) {}

  @Post('extract')
  extract(@Body() dto: ExtractRequestDto): Promise<ExtractResultDto> {
    return this.specExtractionService.extract(dto);
  }
}
```

## Completion Criteria
- [ ] `POST /api/v1/spec/extract` with `{ "imageUrl": "https://example.com/img.png" }` returns mock JSON spec
- [ ] Response matches SpecResult shape (elements array with id, type, label, position, styles)
- [ ] DTOs use class-validator decorators
- [ ] DTOs extend GenericAssignDto<T>
- [ ] No `any` type anywhere

## Commit Message
```
feat: add spec-extraction module skeleton with mock response
```

## Forbidden
- No Claude API calls yet (Day 2)
- Never use `@moonward-apps/*` packages
- No `any` type
- No `console.log`
