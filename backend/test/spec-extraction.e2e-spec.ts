import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { GlobalExceptionFilter } from '../src/shared/filter/global-exception.filter';

/**
 * E2E test for the backend pipeline: HTTP request → controller → service →
 * DTO validation → serialized JSON response.
 *
 * The only external boundary — the Claude (Anthropic) API — is mocked so the
 * test is deterministic and runnable in CI without a real API key, network
 * access, or per-run cost. Real end-to-end verification against the live Claude
 * API is covered by the manual checklist in test/MANUAL_E2E.md.
 */
const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
);

/** A valid spec the mocked Claude returns for the success-path test. */
const VALID_SPEC = {
  elements: [
    {
      id: 'btn-primary',
      type: 'button',
      label: 'Submit',
      position: { x: 10, y: 20, width: 120, height: 40 },
      styles: {
        backgroundColor: '#2563EB',
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '8px',
        padding: '12px 24px 12px 24px',
        margin: null,
        border: 'none',
        gap: null,
      },
    },
  ],
};

const claudeTextResponse = (text: string) => ({
  content: [{ type: 'text', text }],
});

describe('Spec Extraction E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Provide the env vars ConfigSchemaValidation (Joi) requires so AppModule
    // can bootstrap without a real .env file. These are dummy values — the
    // Anthropic and Supabase clients are never actually reached over the wire.
    process.env.NODE_ENV = 'development';
    process.env.PROJECT_NAME = 'snaptospec-e2e';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.ALLOWED_CORS_ORIGIN = 'http://localhost:3001';
    process.env.FRONTEND_BASE_URL = 'http://localhost:3001';

    // Import AppModule only after env is in place so module init validation passes.
    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror the global setup from src/main.ts so the e2e behavior matches prod.
    app
      .setGlobalPrefix('api/v1')
      .useGlobalPipes(
        new ValidationPipe({
          transform: true,
          forbidNonWhitelisted: true,
          whitelist: true,
        }),
      )
      .useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
      .useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('GET /api/v1/health → 200 { status: "ok" }', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('POST /api/v1/spec/extract with valid imageUrl → 200 with elements array', async () => {
    mockCreate.mockResolvedValue(
      claudeTextResponse(JSON.stringify(VALID_SPEC)),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({ imageUrl: 'https://example.supabase.co/screenshot.png' })
      .expect(200);

    expect(response.body).toHaveProperty('elements');
    expect(Array.isArray(response.body.elements)).toBe(true);
    expect(response.body.elements).toHaveLength(1);

    const [element] = response.body.elements;
    expect(element).toHaveProperty('id', 'btn-primary');
    expect(element).toHaveProperty('type', 'button');
    expect(element).toHaveProperty('position');
    expect(element).toHaveProperty('styles');
  });

  it('POST /api/v1/spec/extract returns an empty array when no UI is found', async () => {
    mockCreate.mockResolvedValue(
      claudeTextResponse(JSON.stringify({ elements: [] })),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({ imageUrl: 'https://example.supabase.co/blank.png' })
      .expect(200);

    expect(response.body.elements).toEqual([]);
  });

  it('POST /api/v1/spec/extract maps a Claude failure to 500', async () => {
    mockCreate.mockRejectedValue(new Error('network down'));

    await request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({ imageUrl: 'https://example.supabase.co/screenshot.png' })
      .expect(500);
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

  it('POST /api/v1/spec/extract rejects unknown fields → 400', () => {
    return request(app.getHttpServer())
      .post('/api/v1/spec/extract')
      .send({ imageUrl: 'https://example.supabase.co/x.png', evil: true })
      .expect(400);
  });
});
