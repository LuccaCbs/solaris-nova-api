import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { NOVA_SYSTEM_PROMPT } from '../nova-system-prompt';

export interface GeminiIntentResult {
  intent:
    | 'create_product'
    | 'search_product'
    | 'update_stock'
    | 'list_low_stock'
    | 'get_dashboard_summary'
    | 'create_category'
    | 'unknown';

  language?: string;

  confidence?: number | string;

  extracted_fields?: Record<string, unknown>;

  fields?: Record<string, unknown>;
}

@Injectable()
export class GeminiAgentService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });

    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async analyzeMessage(message: string): Promise<GeminiIntentResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${NOVA_SYSTEM_PROMPT}\n\nUser message:\n${message}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const content = response.text;

    if (!content) {
      return {
        intent: 'unknown',
        confidence: 0,
      };
    }

    try {
      const parsed = JSON.parse(content) as GeminiIntentResult;

      if (typeof parsed.confidence === 'string') {
        parsed.confidence =
          parsed.confidence === 'high'
            ? 0.95
            : parsed.confidence === 'medium'
              ? 0.7
              : 0.3;
      }

      return parsed;
    } catch {
      return {
        intent: 'unknown',
        confidence: 0,
      };
    }
  }
}
