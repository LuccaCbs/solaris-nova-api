import { Test, TestingModule } from '@nestjs/testing';
import { SolarisApiService } from './solaris-api.service';

describe('SolarisApiService', () => {
  let service: SolarisApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolarisApiService],
    }).compile();

    service = module.get<SolarisApiService>(SolarisApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
