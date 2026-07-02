export interface SupplierOrderItemDraft {
  productQuery: string;
  quantity: number;
  productId?: number;
  productName?: string;
}

export interface CreateSupplierOrderDraft {
  supplierQuery?: string;
  supplierId?: number;
  supplierName?: string;
  items: SupplierOrderItemDraft[];
}

export interface SupplierOrderActionDraft {
  orderId?: number;
}

export interface UpdateSupplierOrderDraft {
  orderId?: number;

  supplierQuery?: string;
  supplierId?: number;
  supplierName?: string;

  itemsToAdd: SupplierOrderItemDraft[];
  itemsToUpdate: SupplierOrderItemDraft[];
  itemsToRemove: string[];

  items?: {
    productId: number;
    quantity: number;
  }[];
}

export class SupplierOrderActionExtractor {
  static extractCreateSupplierOrderDraft(
    message: string,
  ): CreateSupplierOrderDraft {
    const supplierQuery = this.extractSupplierQuery(message);
    const itemsText = this.extractItemsText(message);

    return {
      supplierQuery,
      items: this.extractItems(itemsText),
    };
  }

  static extractOrderActionDraft(message: string): SupplierOrderActionDraft {
    return {
      orderId: this.extractOrderId(message),
    };
  }

  static extractUpdateSupplierOrderDraft(
    message: string,
  ): UpdateSupplierOrderDraft {
    return {
      orderId: this.extractOrderId(message),
      supplierQuery: this.extractNewSupplierQuery(message),
      itemsToAdd: this.extractItemsToAdd(message),
      itemsToUpdate: this.extractItemsToUpdate(message),
      itemsToRemove: this.extractItemsToRemove(message),
    };
  }

  static extractOrderId(message: string): number | undefined {
    const match = message.match(
      /(?:supplier\s+order|order|pedido|orden)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)/i,
    );

    const id = Number(match?.[1]);

    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  private static extractSupplierQuery(message: string): string | undefined {
    const normalized = message.trim();

    const patterns = [
      /(?:crear|crea|create|make|generar|genera)\s+(?:supplier\s+)?(?:pedido|orden|order)\s+(?:a|para|for|to)\s+(?:supplier|proveedor)?\s*(.+?)(?=\s+(?:con|with|and\s+(?:product|products)|y\s+(?:producto|productos)|product|products|producto|productos)\s+|$)/i,

      /(?:supplier|proveedor)\s+(.+?)(?=\s+(?:and|y)\s+(?:product|products|producto|productos)\s+|$)/i,
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      const value = this.cleanValue(match?.[1]);

      if (value) return value;
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

  private static extractNewSupplierQuery(message: string): string | undefined {
    const patterns = [
      /(?:change|update|set)\s+(?:the\s+)?(?:supplier|provider)\s+(?:to|as)\s+(.+?)(?=\s+(?:and|add|remove|delete|change|update|set)\b|$)/i,
      /(?:cambiar|actualizar|establecer)\s+(?:el\s+)?(?:proveedor)\s+(?:a|por|como)\s+(.+?)(?=\s+(?:y|agregar|añadir|quitar|eliminar|cambiar|actualizar)\b|$)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      const value = this.cleanValue(match?.[1]);

      if (value) return value;
    }

    return undefined;
  }

  private static extractItemsToAdd(message: string): SupplierOrderItemDraft[] {
    const patterns = [
      /(?:add|agregar|agrega|añadir|añade|sumar|suma)\s+(?:product|products|producto|productos)?\s*(.+?)(?=\s+(?:to|al|a)\s+(?:supplier\s+order|order|pedido|orden)\b|$)/i,

      /(?:supplier\s+order|order|pedido|orden)\s*#?\s*\d+\s+(?:add|agregar|agrega|añadir|añade|sumar|suma)\s+(?:product|products|producto|productos)?\s*(.+)$/i,

      /(?:update|edit|modify|actualizar|actualiza|editar|edita|modificar|modifica)\s+(?:supplier\s+)?(?:order|pedido|orden)\s*#?\s*\d+\s+(?:add|agregar|agrega|añadir|añade|sumar|suma)\s+(?:product|products|producto|productos)?\s*(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      const items = this.extractItems(match?.[1] ?? '');

      if (items.length > 0) {
        return items;
      }
    }

    return [];
  }

  private static extractItemsToRemove(message: string): string[] {
    const patterns = [
      /(?:remove|delete)\s+(?:product|products)?\s*(.+?)(?=\s+(?:from|in)\s+(?:supplier\s+order|order)\b|$)/i,
      /(?:quitar|quita|eliminar|elimina|sacar|saca)\s+(?:producto|productos)?\s*(.+?)(?=\s+(?:del|de|en)\s+(?:pedido|orden)\b|$)/i,

      /(?:supplier\s+order|order|pedido|orden)\s*#?\s*\d+\s+(?:remove|delete|quitar|quita|eliminar|elimina|sacar|saca)\s+(?:product|products|producto|productos)?\s*(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      const raw = match?.[1];

      if (!raw) continue;

      return raw
        .replace(/\s*,\s*/g, ' y ')
        .replace(/\s+and\s+/gi, ' y ')
        .split(/\s+y\s+/i)
        .map((item) => this.cleanProductQuery(item))
        .filter((item): item is string => Boolean(item));
    }

    return [];
  }

  private static extractItemsToUpdate(
    message: string,
  ): SupplierOrderItemDraft[] {
    const tailPatterns = [
      /(?:update|edit|modify|actualizar|editar|modificar)?\s*(?:supplier\s+order|order|pedido|orden)\s*#?\s*\d+\s+(.+)$/i,
      /(.+?)\s+(?:in|on|en)\s+(?:supplier\s+order|order|pedido|orden)\s*#?\s*\d+$/i,
    ];

    for (const tailPattern of tailPatterns) {
      const tailMatch = message.match(tailPattern);
      const rawTail = this.cleanValue(tailMatch?.[1]);

      if (!rawTail) continue;

      const tail = rawTail.trim();

      if (
        /^(add|agregar|agrega|añadir|añade|sumar|suma)\b/i.test(tail) ||
        /^(remove|delete|quitar|quita|eliminar|elimina|sacar|saca)\b/i.test(
          tail,
        ) ||
        /^(change|update|set|cambiar|cambia|actualizar|actualiza|establecer|establece)\s+(supplier|provider|proveedor)\b/i.test(
          tail,
        )
      ) {
        continue;
      }

      const quantityMatch = tail.match(
        /^(?:change|update|set|modify|cambiar|actualizar|establecer|modificar)?\s*(?:product|producto)?\s*(?:quantity\s+of\s+|cantidad\s+de\s+)?(.+?)\s*(?:quantity|cantidad)?\s*(?:to|as|a|por|como)\s+(\d+)$/i,
      );

      if (quantityMatch) {
        const productQuery = this.cleanProductQuery(quantityMatch[1]);
        const quantity = Number(quantityMatch[2]);

        if (productQuery && Number.isInteger(quantity) && quantity > 0) {
          return [{ productQuery, quantity }];
        }
      }

      const item = this.extractItem(
        tail.replace(
          /^(change|update|set|modify|cambiar|actualizar|establecer|modificar)\s+/i,
          '',
        ),
      );

      if (item) {
        return [item];
      }
    }

    return [];
  }

  private static extractItems(text: string): SupplierOrderItemDraft[] {
    if (!text.trim()) return [];

    const normalized = text
      .replace(/\s*,\s*/g, ' y ')
      .replace(/\s+\+\s+/g, ' y ')
      .replace(/\s+and\s+/gi, ' y ')
      .replace(/\s+with\s+/gi, ' y ');

    return normalized
      .split(/\s+y\s+/i)
      .map((chunk) => this.extractItem(chunk))
      .filter((item): item is SupplierOrderItemDraft => item !== undefined);
  }

  private static extractItem(
    chunk: string,
  ): SupplierOrderItemDraft | undefined {
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

  private static cleanValue(value: string | undefined): string | undefined {
    const cleaned = value
      ?.trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ');

    return cleaned || undefined;
  }
}
