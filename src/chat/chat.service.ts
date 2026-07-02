import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from './dto/chat-response.dto';
import { NovaAgentService } from '../agent/nova-agent/nova-agent.service';

@Injectable()
export class ChatService {
  constructor(private readonly novaAgentService: NovaAgentService) {}

  handleMessage(
    message: string,
    authorization?: string,
    language?: string,
  ): Promise<ChatResponseDto> {
    return this.novaAgentService.processMessage(
      message,
      authorization,
      language,
    );
  }

  resetChat(language?: string) {
    return this.novaAgentService.resetConversation(language);
  }
}
