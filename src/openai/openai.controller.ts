import { Controller, Post, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RateLimitGuard } from 'src/shared/guards/rate-limit.guard';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openai: OpenaiService) {}

  @UseGuards(AuthGuard, RateLimitGuard)
  @Post('chat')
  @HttpCode(200)
  async chat(@Req() req, @Body() body: ChatRequestDto) {
    const userId = req.user?.id;
    return this.openai.chat(body.messages, userId);
  }
}