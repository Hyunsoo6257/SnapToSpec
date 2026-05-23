# Week 2 Day 4 — E2E Backend Test: Upload → Extract

## Goal
Verify the complete backend flow end-to-end: upload a real screenshot → get back a valid JSON spec.
Write integration tests and manual test instructions.

## Context
- FileModule (upload) and SpecExtractionModule (extract) both exist
- Today: connect them, write E2E tests, verify the full backend pipeline works
- This is the CRITICAL checkpoint for Week 2

## Tasks

### 1. Add E2E Test

Create `backend/test/spec-extraction.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Spec Extraction E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health → 200', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('POST /api/v1/spec/extract with valid imageUrl → 200 with elements', async () => {
    // Use a publicly accessible test image URL
    const response = await request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({ imageUrl: 'https://via.placeholder.com/400x300.png' })
      .expect(200);

    expect(response.body).toHaveProperty('elements');
    expect(Array.isArray(response.body.elements)).toBe(true);
  });

  it('POST /api/v1/spec/extract with invalid imageUrl → 400', () => {
    return request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({ imageUrl: 'not-a-url' })
      .expect(400);
  });

  it('POST /api/v1/spec/extract with missing imageUrl → 400', () => {
    return request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({})
      .expect(400);
  });
});
```

Add supertest:
```json
"@types/supertest": "^6.0.0",
"supertest": "^6.3.0"
```

### 2. Add e2e test script to backend/package.json
```json
"test:e2e": "jest --config ./test/jest-e2e.json"
```

Create `backend/test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

### 3. Manual Test Checklist (add to PR description)

Feature Agent should verify these manually before committing:

```
MANUAL TEST RESULTS (run before committing):

1. Start server: npm run start:dev
   ✅/❌ Server starts without errors

2. Health check: GET http://localhost:3000/api/v1/health
   ✅/❌ Returns { "status": "ok" }

3. Swagger: http://localhost:3000/api/swagger
   ✅/❌ Swagger UI loads, shows /file/upload and /spec/extract endpoints

4. Upload test: POST http://localhost:3000/api/v1/file/upload
   (multipart form-data, field: "file", value: any PNG/JPG)
   ✅/❌ Returns { "imageUrl": "https://..." }

5. Extract test: POST http://localhost:3000/api/v1/spec/extract
   { "imageUrl": "<url from step 4>" }
   ✅/❌ Returns { "elements": [...] }
   ✅/❌ elements array is not empty
   ✅/❌ each element has id, type, position, styles
```

## Completion Criteria
- [ ] `npm test` passes (unit tests)
- [ ] `npm run test:e2e` passes (e2e tests)
- [ ] Manual test checklist completed (all 5 items checked)
- [ ] `/api/v1/health` → `{ "status": "ok" }`
- [ ] `/api/v1/spec/extract` with real image URL → returns elements array

## Commit Message
```
test: add e2e tests for upload and spec extraction pipeline
```

## Forbidden
- No `any` type
- No `console.log`
- Never use `@moonward-apps/*` packages
