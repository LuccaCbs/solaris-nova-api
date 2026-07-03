export interface SalesListDraft {
  date?: string;
}

export interface ShowSaleDraft {
  saleId?: number;
}

export interface DailySalesSummaryDraft {
  date?: string;
}

export class SalesActionExtractor {
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

    if (/\b(hoy|today)\b/.test(normalized)) {
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
