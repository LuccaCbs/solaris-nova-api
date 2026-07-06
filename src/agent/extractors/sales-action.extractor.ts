import type { SalePaymentMethodDto } from '../../solaris-client/solaris-api/solaris-api.service';

export interface SalesListDraft {
  date?: string;
}

export interface ShowSaleDraft {
  saleId?: number;
}

export interface DailySalesSummaryDraft {
  date?: string;
}

export interface CreateSaleItemDraft {
  productQuery: string;
  quantity: number;
  productId?: number;
  productName?: string;
}

export interface CreateSaleDraft {
  paymentMethod?: SalePaymentMethodDto;
  items: CreateSaleItemDraft[];
}

export class SalesActionExtractor {
  static extractCreateSaleDraft(message: string): CreateSaleDraft {
    return {
      paymentMethod: this.extractPaymentMethod(message),
      items: this.extractItems(this.extractItemsText(message)),
    };
  }

  static extractPaymentMethod(
    message: string,
  ): SalePaymentMethodDto | undefined {
    const normalized = message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (/\b(efectivo|cash|contado)\b/.test(normalized)) {
      return 'CASH';
    }

    if (/\b(tarjeta\s+de\s+debito|debito|debit\s+card|debit)\b/.test(normalized)) {
      return 'DEBIT_CARD';
    }

    if (
      /\b(tarjeta\s+de\s+credito|credito|credit\s+card|credit)\b/.test(
        normalized,
      )
    ) {
      return 'CREDIT_CARD';
    }

    if (/\b(transferencia|transfer)\b/.test(normalized)) {
      return 'TRANSFER';
    }

    if (/\b(otro|other)\b/.test(normalized)) {
      return 'OTHER';
    }

    return undefined;
  }

  private static extractItemsText(message: string): string {
    const patterns = [
      /\b(?:con|with)\b\s+(?:product|products|producto|productos)?\s*(.+)$/i,
      /\b(?:and|y)\s+(?:product|products|producto|productos)\s+(.+)$/i,
      /\b(?:product|products|producto|productos)\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);

      if (match?.[1]?.trim()) {
        return match[1].trim();
      }
    }

    return '';
  }

  private static extractItems(text: string): CreateSaleItemDraft[] {
    if (!text.trim()) return [];

    const normalized = text
      .replace(/\s*,\s*/g, ' y ')
      .replace(/\s+\+\s+/g, ' y ')
      .replace(/\s+and\s+/gi, ' y ')
      .replace(/\s+with\s+/gi, ' y ');

    return normalized
      .split(/\s+y\s+/i)
      .map((chunk) => this.extractItem(chunk))
      .filter((item): item is CreateSaleItemDraft => item !== undefined);
  }

  private static extractItem(chunk: string): CreateSaleItemDraft | undefined {
    const match = chunk.match(
      /(?:(\d+)\s*(?:unidades|unidad|units|unit|u|x)?\s+(.+)|(.+?)\s*(?:x|por)\s*(\d+))/i,
    );

    if (!match) return undefined;

    const quantity = match[1] ? Number(match[1]) : Number(match[4]);
    const productQuery = this.cleanProductQuery(match[2] ?? match[3]);

    if (!productQuery || Number.isNaN(quantity) || quantity <= 0) {
      return undefined;
    }

    return {
      productQuery,
      quantity,
    };
  }

  private static cleanProductQuery(
    value: string | undefined,
  ): string | undefined {
    const cleaned = value
      ?.trim()
      .replace(/^(product|products|producto|productos)\s+/i, '')
      .replace(/\s+(quantity|cantidad)$/i, '')
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ');

    return cleaned || undefined;
  }

  static extractSaleId(message: string): number | undefined {
    const match = message.match(
      /(?:venta|sale)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)/i,
    );

    const id = Number(match?.[1]);

    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  static extractListDate(message: string): string | undefined {
    return this.extractDate(message);
  }

  static extractSummaryDate(message: string): string | undefined {
    return this.extractDate(message);
  }

  private static extractDate(message: string): string | undefined {
    const normalized = message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const today = new Date();
    const toIso = (date: Date) => date.toISOString().split('T')[0];

    if (/\b(hoy|today|del\s+dia|of\s+the\s+day)\b/.test(normalized)) {
      return toIso(today);
    }

    if (/\b(ayer|yesterday)\b/.test(normalized)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return toIso(yesterday);
    }

    const dateMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);

    return dateMatch?.[1];
  }
}
