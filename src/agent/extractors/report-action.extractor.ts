export type ReportModule = 'sales' | 'merchandise_intake';

export interface ReportDateRange {
  from: string;
  to: string;
}

export class ReportActionExtractor {
  static extractModule(message: string): ReportModule | null {
    const normalized = this.normalize(message);

    if (/\b(ventas|sales|vendes)\b/.test(normalized)) {
      return 'sales';
    }

    if (
      /\b(ingreso\s+de\s+mercaderia|mercaderia|restock|recepcion)\b/.test(
        normalized,
      )
    ) {
      return 'merchandise_intake';
    }

    return null;
  }

  static extractDateRange(message: string): ReportDateRange {
    const today = this.toIsoDate(new Date());
    const normalized = this.normalize(message);

    const rangeMatch = message.match(
      /\bdesde\s+(.+?)\s+hasta\s+(.+?)(?:\s*$|\.|,)/i,
    );

    if (rangeMatch) {
      const from = this.parseDateToken(rangeMatch[1]) ?? today;
      const to = this.parseDateToken(rangeMatch[2]) ?? today;

      return this.normalizeRange(from, to);
    }

    const dayWithDateMatch = message.match(
      /\bd[ií]a\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    );

    if (dayWithDateMatch) {
      const date = this.parseDateToken(dayWithDateMatch[1]) ?? today;

      return { from: date, to: date };
    }

    if (/\b(hoy|today|del\s+d[ií]a|d[ií]a)\b/.test(normalized)) {
      return { from: today, to: today };
    }

    const isoMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);

    if (isoMatch?.[1]) {
      return { from: isoMatch[1], to: isoMatch[1] };
    }

    const explicitDate = this.extractAnyLocalizedDate(message);

    if (explicitDate) {
      return { from: explicitDate, to: explicitDate };
    }

    return { from: today, to: today };
  }

  private static normalizeRange(from: string, to: string): ReportDateRange {
    if (from <= to) {
      return { from, to };
    }

    return { from: to, to: from };
  }

  private static parseDateToken(value: string): string | undefined {
    const trimmed = value.trim().replace(/\.$/, '');

    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);

    if (isoMatch?.[1]) {
      return isoMatch[1];
    }

    return this.extractAnyLocalizedDate(trimmed);
  }

  private static extractAnyLocalizedDate(value: string): string | undefined {
    const match = value.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);

    if (!match) {
      return undefined;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return undefined;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private static normalize(message: string): string {
    return message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private static toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
