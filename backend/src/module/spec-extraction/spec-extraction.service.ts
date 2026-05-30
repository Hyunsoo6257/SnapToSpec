import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResultDto } from './dto/extract-result.dto';

@Injectable()
export class SpecExtractionService {
  private readonly logger = new Logger(SpecExtractionService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
      timeout: 60000, // 60 second timeout — Claude vision calls can be slow
    });
  }

  async extract(dto: ExtractRequestDto): Promise<ExtractResultDto> {
    this.logger.log(`Extracting spec from image: ${dto.imageUrl}`);

    this.warnIfUnexpectedHost(dto.imageUrl);

    const rawText = await this.requestCompletion(dto);
    const parsed = this.parseJson(rawText);
    const result = await this.validateResult(parsed);

    if (result.elements.length === 0) {
      // Not an error — the image may simply contain no UI elements.
      this.logger.warn(`No elements extracted from image: ${dto.imageUrl}`);
    }

    this.logger.log(
      `Extracted ${result.elements.length} element(s) from image: ${dto.imageUrl}`,
    );

    return result;
  }

  /**
   * For MVP we accept any valid URL (the DTO already enforces URL format).
   * We only warn when the image is not served from the configured Supabase
   * Storage host, so unexpected sources are visible in the logs.
   */
  private warnIfUnexpectedHost(imageUrl: string): void {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      return;
    }

    try {
      const expectedHost = new URL(supabaseUrl).host;
      const actualHost = new URL(imageUrl).host;
      if (actualHost !== expectedHost) {
        this.logger.warn(
          `imageUrl host "${actualHost}" is not the expected Supabase host "${expectedHost}"`,
        );
      }
    } catch {
      // URL format is already validated by the DTO; ignore parse issues here.
    }
  }

  private async requestCompletion(dto: ExtractRequestDto): Promise<string> {
    let response: Anthropic.Messages.Message;

    try {
      response = await this.anthropic.messages.create({
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
- If unsure about any value → null
- If the image contains no UI elements, return { "elements": [] }`,
              },
            ],
          },
        ],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Claude API request failed: ${message}`);
      throw new InternalServerErrorException(
        'Failed to reach Claude API for spec extraction',
      );
    }

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      this.logger.error('Claude response did not contain a text block');
      throw new InternalServerErrorException('Unexpected Claude response type');
    }

    return content.text.trim();
  }

  private parseJson(rawText: string): unknown {
    let text = rawText;
    if (text.startsWith('```')) {
      text = text
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    }

    try {
      return JSON.parse(text);
    } catch {
      this.logger.error(`Claude returned non-JSON: ${text.slice(0, 200)}`);
      throw new InternalServerErrorException('Claude returned invalid JSON');
    }
  }

  private async validateResult(parsed: unknown): Promise<ExtractResultDto> {
    const result = plainToInstance(ExtractResultDto, parsed);
    const errors = await validate(result, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      this.logger.error(
        `Claude response failed validation: ${JSON.stringify(errors)}`,
      );
      throw new InternalServerErrorException(
        'Claude returned unexpected spec structure',
      );
    }

    return result;
  }
}
