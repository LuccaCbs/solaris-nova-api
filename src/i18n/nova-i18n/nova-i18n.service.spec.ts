import { Test, TestingModule } from '@nestjs/testing';
import { NovaI18nService } from './nova-i18n.service';

describe('NovaI18nService', () => {
  let service: NovaI18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NovaI18nService],
    }).compile();

    service = module.get<NovaI18nService>(NovaI18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
