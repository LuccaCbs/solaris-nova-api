import { Test, TestingModule } from '@nestjs/testing';
import { GeminiAgentService } from './gemini-agent.service';

describe('GeminiAgentService', () => {
  let service: GeminiAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiAgentService],
    }).compile();

    service = module.get<GeminiAgentService>(GeminiAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
