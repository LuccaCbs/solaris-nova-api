import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmationStateService } from './confirmation-state.service';

describe('ConfirmationStateService', () => {
  let service: ConfirmationStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfirmationStateService],
    }).compile();

    service = module.get<ConfirmationStateService>(ConfirmationStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
