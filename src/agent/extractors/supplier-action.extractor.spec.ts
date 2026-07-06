import { SupplierActionExtractor } from './supplier-action.extractor';

describe('SupplierActionExtractor', () => {
  describe('extractUpdateSupplierDraft', () => {
    it('parses multiple fields without treating trailing text as supplier name', () => {
      const draft = SupplierActionExtractor.extractUpdateSupplierDraft(
        'Actualizar proveedor Proveedor demo nombre X contacto Y dirección Z',
      );

      expect(draft.supplierQuery).toBe('Proveedor demo');
      expect(draft.name).toBe('X');
      expect(draft.contactName).toBe('Y');
      expect(draft.address).toBe('Z');
    });

    it('parses a single field update', () => {
      const draft = SupplierActionExtractor.extractUpdateSupplierDraft(
        'Actualizar proveedor Proveedor demo email compras@demo.com',
      );

      expect(draft.supplierQuery).toBe('Proveedor demo');
      expect(draft.email).toBe('compras@demo.com');
    });
  });
});
