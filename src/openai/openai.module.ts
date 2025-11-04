// src/openai/openai.module.ts
import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { HttpModule } from 'node_modules/@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60_000,
      maxRedirects: 5,
      // no pongas la API key aquí; se usará en el service via process.env.OPENAI_API_KEY
    }),
  ],
  controllers: [OpenaiController],
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}