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

  it('classifies list sales separately from daily summary', () => {
    expect(service.classify('ver ventas')).toBe('list_sales');
    expect(service.classify('Ver ventas del día')).toBe(
      'get_daily_sales_summary',
    );
    expect(service.classify('resumen de ventas de hoy')).toBe(
      'get_daily_sales_summary',
    );
    expect(service.classify('ventas de hoy')).toBe('list_sales');
    expect(service.classify('mostrar ventas')).toBe('list_sales');
  });

  it('classifies export report separately from list sales', () => {
    expect(service.classify('ver informe de ventas del día')).toBe(
      'export_report',
    );
    expect(service.classify('informe de ventas desde 01/07/2026 hasta 06/07/2026')).toBe(
      'export_report',
    );
    expect(service.classify('ver ventas')).toBe('list_sales');
  });
});
