export interface EmitInvoiceDraft {
  saleId?: number;
  customerQuery?: string;
  customerId?: number;
}

export class FiscalActionExtractor {
  static extractEmitInvoiceDraft(message: string): EmitInvoiceDraft {
    return {
      saleId: this.extractSaleIdForInvoice(message),
      customerQuery: this.extractCustomerQuery(message),
      customerId: this.extractCustomerId(message),
    };
  }

  static extractFiscalDocumentId(message: string): number | undefined {
    const match = message.match(
      /(?:comprobante|factura|fiscal|invoice|document)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)/i,
    );

    const id = Number(match?.[1]);

    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  private static extractSaleIdForInvoice(
    message: string,
  ): number | undefined {
    const patterns = [
      /(?:facturar|emitir|invoice|emit)\s+(?:la\s+)?(?:venta|sale)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)/i,
      /(?:venta|sale)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)\s*(?:facturar|invoice|emitir)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      const id = Number(match?.[1]);

      if (Number.isInteger(id) && id > 0) {
        return id;
      }
    }

    return undefined;
  }

  private static extractCustomerId(message: string): number | undefined {
    const match = message.match(
      /(?:cliente|customer)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)/i,
    );

    const id = Number(match?.[1]);

    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  private static extractCustomerQuery(message: string): string | undefined {
    const patterns = [
      /(?:para|for)\s+(?:el\s+)?(?:cliente|customer)\s+(.+?)(?:$|\.)/i,
      /(?:cliente|customer)\s+(.+?)(?:$|\.)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      const value = match?.[1]
        ?.trim()
        .replace(/^#?\d+$/, '')
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, ' ');

      if (value) {
        return value;
      }
    }

    return undefined;
  }
}
