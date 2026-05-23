# Week 2 Day 3 — Prompt Tuning + Error Handling

## Goal
Harden the Claude API integration: better error handling, input validation, response validation, and edge cases.

## Context
- Claude API integration from Day 2 exists
- Today: make the extraction robust before frontend integration
- Validate that Claude's response actually matches SpecResult shape
- Handle network errors, malformed responses, empty images
- Add response validation so bad Claude output doesn't crash the frontend

## Changes to Make

### 1. Add Response Validation

After parsing Claude's JSON, validate it matches expected shape before returning:

```typescript
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// After JSON.parse:
const result = plainToInstance(ExtractResultDto, parsed);
const errors = await validate(result);
if (errors.length > 0) {
  this.logger.error('Claude response failed validation', JSON.stringify(errors));
  throw new InternalServerErrorException('Claude returned unexpected spec structure');
}
```

### 2. Add Input Validation: File URL Check

In ExtractRequestDto, ensure imageUrl points to the project's own Supabase storage:
```typescript
// Add custom validator or note in swagger that only Supabase Storage URLs are accepted
// For MVP: just validate it's a valid URL, log a warning if not from expected domain
```

### 3. Add Request Timeout

Claude API calls can be slow. Add a timeout:
```typescript
// In service constructor:
this.anthropic = new Anthropic({
  apiKey: ...,
  timeout: 60000, // 60 second timeout
});
```

### 4. Handle Empty/No Elements Response

If Claude returns `{ "elements": [] }`:
```typescript
if (!result.elements || result.elements.length === 0) {
  this.logger.warn(`No elements extracted from image: ${dto.imageUrl}`);
  // Return empty result (not an error — image may have no UI elements)
}
```

### 5. Add Swagger Documentation

Improve controller with proper Swagger decorators:
```typescript
@Post('extract')
@ApiOperation({ summary: 'Extract UI spec from screenshot' })
@ApiBody({ type: ExtractRequestDto })
@ApiResponse({ status: 200, type: ExtractResultDto, description: 'Extracted spec' })
@ApiResponse({ status: 400, description: 'Invalid imageUrl' })
@ApiResponse({ status: 500, description: 'Claude API or parsing error' })
extract(@Body() dto: ExtractRequestDto): Promise<ExtractResultDto>
```

### 6. Unit Test for SpecExtractionService

Create `spec-extraction.service.spec.ts`:
- Mock Anthropic client
- Test: valid JSON response → returns ExtractResultDto
- Test: invalid JSON from Claude → throws InternalServerErrorException
- Test: empty elements array → returns empty result

```typescript
// backend/src/module/spec-extraction/spec-extraction.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SpecExtractionService } from './spec-extraction.service';

describe('SpecExtractionService', () => {
  // Mock Anthropic and ConfigService
  // Test the 3 cases above
});
```

## Completion Criteria
- [ ] Service has try-catch on all Claude API calls
- [ ] Invalid JSON from Claude → 500 with descriptive message (not stack trace)
- [ ] Empty elements response → returns `{ elements: [] }` (not error)
- [ ] Claude timeout set to 60 seconds
- [ ] Unit tests pass: `npm test` exits 0
- [ ] Swagger docs show correct request/response shape at `/api/swagger`

## Commit Message
```
feat: harden spec extraction with validation, error handling, and tests
```

## Forbidden
- No `any` type
- No `console.log`
- Never use `@moonward-apps/*` packages
