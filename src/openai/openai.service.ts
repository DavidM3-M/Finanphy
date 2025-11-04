// src/openai/openai.service.ts
import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  constructor(private readonly httpService: HttpService) {}

  async chat(messages: any[], userId?: string) {
    const payload = { model: 'gpt-3.5-turbo', messages };
    try {
      const resp$: Promise<AxiosResponse> = lastValueFrom(
        this.httpService.post('https://api.openai.com/v1/chat/completions', payload, {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      const resp = await resp$;
      return resp.data;
    } catch (e: any) {
      const status = e?.response?.status;
      this.logger.error('OpenAI call failed', e?.stack || e);
      if (status === 401) throw new HttpException('OpenAI key invalid', 502);
      if (status === 429) throw new HttpException('Rate limited by OpenAI', 429);
      throw new HttpException('OpenAI proxy error', 502);
    }
  }
}