import { Test, TestingModule } from '@nestjs/testing';
import { IntentClassifierService } from './intent-classifier.service';

describe('IntentClassifierService', () => {
  let service: IntentClassifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntentClassifierService],
    }).compile();

    service = module.get<IntentClassifierService>(IntentClassifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
