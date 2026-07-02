export interface CreateProductDraft {
  name?: string;
  price?: number;
  stock?: number;
  categoryName?: string;
}

export interface UpdateProductDraft {
  productQuery?: string;
  productId?: number;
  productName?: string;
  name?: string;
  description?: string;
  sku?: string;
  price?: number;
  categoryName?: string;
}

export interface DeactivateProductDraft {
  productQuery?: string;
  productId?: number;
  productName?: string;
}

export interface ActivateProductDraft {
  productQuery?: string;
  productId?: number;
  productName?: string;
}

export interface UpdateStockDraft {
  productId?: number | string;
  productQuery?: string;
  quantity?: number;
  mode: 'increment' | 'decrement' | 'set';
}

export interface CreateCategoryDraft {
  name?: string;
  description?: string;
}

export class ProductActionExtractor {
  static extractCreateProductDraft(message: string): CreateProductDraft {
    const normalized = message.trim();

    const priceMatch = normalized.match(
      /(?:precio|price)\s+(\d+(?:[.,]\d+)?)/i,
    );

    const stockMatch = normalized.match(
      /(?:stock|initial stock|stock inicial)\s+(\d+)/i,
    );

    const categoryMatch = normalized.match(
      /(?:categor[ií]a|category)\s+([a-zA-ZÁÉÍÓÚáéíóúÑñ0-9\s]+)/i,
    );

    const name = this.cleanCreateProductName(normalized);

    return {
      name,
      price: priceMatch ? Number(priceMatch[1].replace(',', '.')) : undefined,
      stock: stockMatch ? Number(stockMatch[1]) : undefined,
      categoryName: categoryMatch ? categoryMatch[1].trim() : undefined,
    };
  }

  static extractUpdateProductDraft(message: string): UpdateProductDraft {
    const normalized = message.trim();

    const priceMatch = normalized.match(
      /(?:precio|price)\s*(?:is|es|:)?\s*(\d+(?:[.,]\d+)?)/i,
    );

    const skuMatch = normalized.match(
      /(?:sku)\s*(?:is|es|:)?\s*([a-zA-Z0-9-_]+)/i,
    );

    const nameMatch = normalized.match(
      /(?:name|nombre)\s*(?:is|es|:)?\s+(.+?)(?=\s+(?:price|precio|sku|description|descripcion|descripción|category|categoria|categoría)\b|$)/i,
    );

    const descriptionMatch = normalized.match(
      /(?:description|descripcion|descripción)\s*(?:is|es|:)?\s+(.+?)(?=\s+(?:price|precio|sku|category|categoria|categoría)\b|$)/i,
    );

    const categoryMatch = normalized.match(
      /(?:change|set|update|modify|cambiar|cambia|actualizar|actualiza|modificar|modifica)?\s*(?:category|categoria|categoría)\s*(?:is|es|:|to|a|por)?\s+(.+)$/i,
    );

    const productQuery = this.extractUpdateProductQuery(normalized);

    return {
      productQuery,
      name: nameMatch?.[1]?.trim(),
      description: descriptionMatch?.[1]?.trim(),
      sku: skuMatch?.[1]?.trim(),
      price: priceMatch ? Number(priceMatch[1].replace(',', '.')) : undefined,
      categoryName: categoryMatch?.[1]?.trim(),
    };
  }

  static extractDeactivateProductDraft(
    message: string,
  ): DeactivateProductDraft {
    return {
      productQuery: this.extractDeactivateProductQuery(message),
    };
  }

  static extractActivateProductDraft(message: string): ActivateProductDraft {
    return {
      productQuery: this.extractActivateProductQuery(message),
    };
  }

  static extractSearchProductQuery(message: string): string | undefined {
    return this.cleanText(message, [
      /buscar producto/gi,
      /buscar/gi,
      /busca/gi,
      /mostrar producto/gi,
      /mostrar/gi,
      /search product/gi,
      /search/gi,
      /find product/gi,
      /find/gi,
      /show product/gi,
      /show/gi,
      /producto/gi,
      /product/gi,
    ]);
  }

  static extractUpdateStockDraft(message: string): UpdateStockDraft {
    const normalized = message.trim();

    const quantity = this.extractQuantity(normalized);
    const mode = this.extractStockMode(normalized);
    const productQuery = this.cleanUpdateStockProductQuery(
      normalized,
      quantity,
    );

    return {
      productQuery,
      quantity,
      mode,
    };
  }

  static extractCreateCategoryDraft(message: string): CreateCategoryDraft {
    const name = this.cleanText(message, [
      /crear categoría/gi,
      /crear categoria/gi,
      /agregar categoría/gi,
      /agregar categoria/gi,
      /nueva categoría/gi,
      /nueva categoria/gi,
      /create category/gi,
      /add category/gi,
      /new category/gi,
      /categoría/gi,
      /categoria/gi,
      /category/gi,
    ]);

    return { name };
  }

  // ---------------------------------------------------------------------------
  // Create product helpers
  // ---------------------------------------------------------------------------

  private static cleanCreateProductName(message: string): string | undefined {
    return this.cleanText(message, [
      /\b(crear|crea|agregar|agrega|nuevo|nueva)\s+producto\b/gi,
      /\b(create|add|new)\s+product\b/gi,
      /\bprecio\s+\d+(?:[.,]\d+)?\b/gi,
      /\bprice\s+\d+(?:[.,]\d+)?\b/gi,
      /\bstock\s+\d+\b/gi,
      /\binitial stock\s+\d+\b/gi,
      /\bstock inicial\s+\d+\b/gi,
      /\bcategor[ií]a\s+[a-zA-ZÁÉÍÓÚáéíóúÑñ0-9\s"]+\b/gi,
      /\bcategory\s+[a-zA-ZÁÉÍÓÚáéíóúÑñ0-9\s"]+\b/gi,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Update Product helpers
  // ---------------------------------------------------------------------------

  private static extractUpdateProductQuery(
    message: string,
  ): string | undefined {
    const withoutCommand = message
      .replace(/\b(update|edit|modify)\s+(?:the\s+)?product\b/gi, '')
      .replace(
        /\b(actualizar|actualiza|editar|edita|modificar|modifica)\s+(?:el\s+|la\s+)?producto\b/gi,
        '',
      )
      .trim();

    const match = withoutCommand.match(
      /^(.+?)(?=\s+(?:change|set|update|modify|cambiar|cambia|actualizar|actualiza|modificar|modifica)?\s*(?:name|nombre|price|precio|sku|description|descripcion|descripción|category|categoria|categoría)\b|$)/i,
    );

    return this.cleanProductQuery(match?.[1]);
  }

  // ---------------------------------------------------------------------------
  // Deactivate product helpers
  // ---------------------------------------------------------------------------

  private static extractDeactivateProductQuery(
    message: string,
  ): string | undefined {
    return this.cleanProductQuery(
      message
        .replace(/\b(deactivate|disable|remove)\s+(?:the\s+)?product\b/gi, '')
        .replace(/\b(desactivar|desactiva)\s+(?:el\s+|la\s+)?producto\b/gi, '')
        .replace(/\bdar\s+de\s+baja\s+(?:el\s+|la\s+)?producto\b/gi, '')
        .replace(
          /\b(eliminar|elimina|borrar|borra)\s+(?:el\s+|la\s+)?producto\b/gi,
          '',
        ),
    );
  }

  // ---------------------------------------------------------------------------
  // Activate product helpers
  // ---------------------------------------------------------------------------

  private static extractActivateProductQuery(
    message: string,
  ): string | undefined {
    return this.cleanProductQuery(
      message
        .replace(/\b(activate|reactivate|enable)\s+(?:the\s+)?product\b/gi, '')
        .replace(
          /\b(activar|activa|reactivar|reactiva|habilitar|habilita)\s+(?:el\s+|la\s+)?producto\b/gi,
          '',
        ),
    );
  }

  // ---------------------------------------------------------------------------
  // Update stock helpers
  // ---------------------------------------------------------------------------

  private static extractQuantity(message: string): number | undefined {
    const quantityMatch =
      message.match(
        /(?:agregar|agrega|sumar|suma|añadir|añade|add|increase|increment|restock|reponer)\s+(\d+)/i,
      ) ??
      message.match(
        /(?:quitar|quita|restar|resta|remover|remueve|remove|decrease|decrement|subtract|descontar|descuenta)\s+(\d+)/i,
      ) ??
      message.match(/(?:cantidad|quantity|amount)\s+(\d+)/i) ??
      message.match(/(?:stock|a|to)\s+(\d+)/i) ??
      message.match(/\b(\d+)\b/);

    return quantityMatch ? Number(quantityMatch[1]) : undefined;
  }

  private static extractStockMode(message: string): UpdateStockDraft['mode'] {
    if (
      /\b(quitar|quita|restar|resta|remover|remueve|remove|decrease|decrement|subtract|descontar|descuenta)\b/i.test(
        message,
      )
    ) {
      return 'decrement';
    }

    if (
      /\b(agregar|agrega|sumar|suma|añadir|añade|add|increase|increment|restock|reponer)\b/i.test(
        message,
      )
    ) {
      return 'increment';
    }

    return 'set';
  }

  private static cleanUpdateStockProductQuery(
    message: string,
    quantity?: number,
  ): string | undefined {
    return this.cleanText(message, [
      /actualizar stock/gi,
      /actualiza stock/gi,
      /ajustar stock/gi,
      /ajusta stock/gi,
      /establecer stock/gi,
      /update stock/gi,
      /adjust stock/gi,
      /set stock/gi,

      /agregar/gi,
      /agrega/gi,
      /sumar/gi,
      /suma/gi,
      /añadir/gi,
      /añade/gi,
      /add/gi,
      /increase/gi,
      /increment/gi,
      /restock/gi,
      /reponer/gi,

      /quitar/gi,
      /quita/gi,
      /restar/gi,
      /resta/gi,
      /remover/gi,
      /remueve/gi,
      /remove/gi,
      /decrease/gi,
      /decrement/gi,
      /subtract/gi,
      /descontar/gi,
      /descuenta/gi,

      /stock/gi,
      /unidades/gi,
      /units/gi,
      /cantidad/gi,
      /quantity/gi,
      /amount/gi,
      /producto/gi,
      /product/gi,

      new RegExp(`\\b${quantity ?? ''}\\b`, 'gi'),

      /\ba\b/gi,
      /\bal\b/gi,
      /\bde\b/gi,
      /\bdel\b/gi,
      /\bto\b/gi,
      /\bfrom\b/gi,
      /\bof\b/gi,
      /\bfor\b/gi,
      /\bpara\b/gi,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private static cleanProductQuery(
    value: string | undefined,
  ): string | undefined {
    const cleaned = value
      ?.trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ');

    return cleaned || undefined;
  }

  private static cleanText(
    value: string,
    replacements: RegExp[],
  ): string | undefined {
    let result = value;

    replacements.forEach((replacement) => {
      result = result.replace(replacement, '');
    });

    result = result
      .replace(/[,.;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return result || undefined;
  }
}
