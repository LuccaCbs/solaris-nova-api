import { SalesActionExtractor } from './sales-action.extractor';

describe('SalesActionExtractor', () => {
  it('parses create sale with payment and product x quantity suffix', () => {
    const draft = SalesActionExtractor.extractCreateSaleDraft(
      'crear venta efectivo mousepad choso x2',
    );

    expect(draft.paymentMethod).toBe('CASH');
    expect(draft.items).toEqual([
      { productQuery: 'mousepad choso', quantity: 2 },
    ]);
  });

  it('parses create sale with con prefix and leading quantity', () => {
    const draft = SalesActionExtractor.extractCreateSaleDraft(
      'Crear venta en efectivo con 2 Producto prueba',
    );

    expect(draft.paymentMethod).toBe('CASH');
    expect(draft.items).toEqual([
      { productQuery: 'Producto prueba', quantity: 2 },
    ]);
  });

  it('parses multiple products separated by y', () => {
    const draft = SalesActionExtractor.extractCreateSaleDraft(
      'crear venta tarjeta mousepad x2 y teclado x1',
    );

    expect(draft.paymentMethod).toBe('CREDIT_CARD');
    expect(draft.items).toEqual([
      { productQuery: 'mousepad', quantity: 2 },
      { productQuery: 'teclado', quantity: 1 },
    ]);
  });
});
