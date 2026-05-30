import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { SpecExtractionService } from './spec-extraction.service';
import { ExtractRequestDto } from './dto/extract-request.dto';

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
);

/** Build a Claude message response wrapping a single text block. */
const textResponse = (text: string) => ({
  content: [{ type: 'text', text }],
});

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

describe('SpecExtractionService', () => {
  let service: SpecExtractionService;
  const dto = new ExtractRequestDto({
    imageUrl: 'https://example.com/screenshot.png',
  });

  beforeEach(async () => {
    mockCreate.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SpecExtractionService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-anthropic-key'),
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(SpecExtractionService);
  });

  it('returns an ExtractResultDto for a valid JSON response', async () => {
    mockCreate.mockResolvedValue(textResponse(JSON.stringify(VALID_SPEC)));

    const result = await service.extract(dto);

    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].id).toBe('btn-primary');
    expect(result.elements[0].styles.backgroundColor).toBe('#2563EB');
  });

  it('strips markdown code fences before parsing', async () => {
    mockCreate.mockResolvedValue(
      textResponse('```json\n' + JSON.stringify(VALID_SPEC) + '\n```'),
    );

    const result = await service.extract(dto);

    expect(result.elements).toHaveLength(1);
  });

  it('throws InternalServerErrorException on invalid JSON from Claude', async () => {
    mockCreate.mockResolvedValue(textResponse('this is not json'));

    await expect(service.extract(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws InternalServerErrorException when the spec structure is invalid', async () => {
    mockCreate.mockResolvedValue(
      textResponse(JSON.stringify({ elements: [{ id: 'x' }] })),
    );

    await expect(service.extract(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('returns an empty result when Claude finds no elements', async () => {
    mockCreate.mockResolvedValue(
      textResponse(JSON.stringify({ elements: [] })),
    );

    const result = await service.extract(dto);

    expect(result.elements).toEqual([]);
  });

  it('throws InternalServerErrorException when the Claude API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('network down'));

    await expect(service.extract(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
