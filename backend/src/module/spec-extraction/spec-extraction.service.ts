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
