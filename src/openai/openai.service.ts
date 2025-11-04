import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly apiKey = process.env.OPENAI_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  private estimateTokenCount(messages: { role: string; content: string }[]): number {
    const chars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    return Math.ceil(chars / 4); // estimación conservadora: 1 token ≈ 4 caracteres
  }

  private async doRequestWithRetries(payload: any, maxAttempts = 4): Promise<any> {
    let attempt = 0;
    let wait = 500;

    while (++attempt <= maxAttempts) {
      try {
        const response = await lastValueFrom(
          this.httpService.post(this.baseUrl, payload, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }),
        );
        return response.data;
      } catch (error) {
        const e = error as AxiosError;
        const status: number | undefined = e?.response?.status;

        const shouldRetry =
          (status === 429 || (typeof status === 'number' && status >= 500 && status < 600)) &&
          attempt < maxAttempts;

        if (shouldRetry) {
          this.logger.warn(`OpenAI retry ${attempt} after ${wait}ms (status ${status})`);
          await new Promise((resolve) => setTimeout(resolve, wait));
          wait *= 2;
          continue;
        }

        this.logger.error('OpenAI request failed', e?.stack || e);

        if (status === 401) throw new HttpException('OpenAI key invalid', 502);
        if (status === 429) throw new HttpException('Rate limited by OpenAI', 429);

        throw new HttpException('OpenAI proxy error', 502);
      }
    }

    throw new HttpException('OpenAI retries exhausted', 502);
  }

  async chat(messages: { role: string; content: string }[], userId?: string): Promise<any> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpException('Invalid messages array', 400);
    }

    // Compactar historial: conservar system + últimas 6
    const system = messages.find((m) => m.role === 'system');
    const tail = messages.filter((m) => m.role !== 'system').slice(-6);
    const compacted = system ? [system, ...tail] : tail;

    // Estimar tokens
    const tokensEst = this.estimateTokenCount(compacted);
    if (tokensEst > 6000) {
      this.logger.warn(`Large token estimate ${tokensEst} for user ${userId}`);
      throw new HttpException('Payload too large', 413);
    }

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: compacted,
    };

    return this.doRequestWithRetries(payload, 4);
  }
}