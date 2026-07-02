import { Test, TestingModule } from '@nestjs/testing';
import { NovaAgentService } from './nova-agent.service';

describe('NovaAgentService', () => {
  let service: NovaAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NovaAgentService],
    }).compile();

    service = module.get<NovaAgentService>(NovaAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
