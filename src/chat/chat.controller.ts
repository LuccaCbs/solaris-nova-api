import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { GeminiAgentService } from '../agent/gemini-agent/gemini-agent.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly geminiAgentService: GeminiAgentService,
  ) {}

  @Post()
  handleMessage(
    @Body() body: ChatRequestDto,
    @Headers('authorization') authorization?: string,
    @Headers('accept-language') language?: string,
  ) {
    return this.chatService.handleMessage(
      body.message,
      authorization,
      language,
    );
  }

  @Post('debug/analyze')
  analyzeMessage(@Body() body: ChatRequestDto) {
    return this.geminiAgentService.analyzeMessage(body.message);
  }

  @Post('reset')
  resetChat(@Headers('accept-language') language?: string) {
    return this.chatService.resetChat(language);
  }
}
