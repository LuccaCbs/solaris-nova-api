export interface CreateSupplierDraft {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierDraft {
  supplierQuery?: string;
  supplierId?: number;
  supplierName?: string;
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export interface DeleteSupplierDraft {
  supplierQuery?: string;
  supplierId?: number;
  supplierName?: string;
}

export class SupplierActionExtractor {
  private static readonly UPDATE_FIELD_BOUNDARY =
    '(?=\\s+(?:with|and|nombre|name|contact name|contact|contacto|phone number|phone|telefono|teléfono|tel|email|mail|address|direccion|dirección|notes|notas|active|inactive|activo|inactivo)\\b|$)';

  static extractCreateSupplierDraft(message: string): CreateSupplierDraft {
    const normalized = message.trim();

    const email = this.extractEmail(normalized);
    const phone = this.extractPhone(normalized);
    const contactName = this.extractContactName(normalized);
    const address = this.extractAddress(normalized);
    const notes = this.extractNotes(normalized);
    const name = this.cleanSupplierName(normalized);

    return {
      name,
      contactName,
      email,
      phone,
      address,
      notes,
    };
  }

  static extractUpdateSupplierDraft(message: string): UpdateSupplierDraft {
    const normalized = message.trim();

    const email = this.extractEmail(normalized);
    const phone = this.extractPhone(normalized);
    const name = this.extractName(normalized);
    const contactName = this.extractContactName(normalized);
    const address = this.extractAddress(normalized);
    const notes = this.extractNotes(normalized);
    const active = this.extractActive(normalized);
    const supplierQuery = this.extractUpdateSupplierQuery(normalized);

    return {
      supplierQuery,
      name,
      contactName,
      email,
      phone,
      address,
      notes,
      active,
    };
  }

  static extractDeleteSupplierDraft(message: string): DeleteSupplierDraft {
    return {
      supplierQuery: this.extractDeleteSupplierQuery(message),
    };
  }

  static extractSearchSupplierQuery(message: string): string | undefined {
    return this.cleanText(message, [
      /buscar proveedor/gi,
      /busca proveedor/gi,
      /mostrar proveedor/gi,
      /ver proveedor/gi,
      /search supplier/gi,
      /find supplier/gi,
      /show supplier/gi,
      /proveedor/gi,
      /supplier/gi,
    ]);
  }

  private static extractEmail(message: string): string | undefined {
    return message.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  }

  private static extractPhone(message: string): string | undefined {
    return (
      message.match(
        /(?:phone number|phone|telefono|teléfono|tel|celular|mobile)\s*(?:is|es|:)?\s*(\+?[1-9]\d{7,14})/i,
      )?.[1] ?? message.match(/\+?[1-9]\d{7,14}/)?.[0]
    );
  }

  private static extractName(message: string): string | undefined {
    return this.cleanValue(
      message.match(
        new RegExp(
          `(?:nombre|name)\\s*(?:is|es|:)?\\s+(.+?)${this.UPDATE_FIELD_BOUNDARY}`,
          'i',
        ),
      )?.[1],
    );
  }

  private static extractContactName(message: string): string | undefined {
    return this.cleanValue(
      message.match(
        new RegExp(
          `(?:with\\s+)?(?:contact name|contact|contacto)\\s*(?:is|es|:)?\\s+(.+?)${this.UPDATE_FIELD_BOUNDARY}`,
          'i',
        ),
      )?.[1],
    );
  }

  private static extractAddress(message: string): string | undefined {
    return this.cleanValue(
      message.match(
        new RegExp(
          `(?:address|direccion|dirección)\\s*(?:is|es|:)?\\s+(.+?)${this.UPDATE_FIELD_BOUNDARY}`,
          'i',
        ),
      )?.[1],
    );
  }

  private static extractNotes(message: string): string | undefined {
    return this.cleanValue(
      message.match(/(?:notes|notas)\s*(?:are|son|is|es|:)?\s+(.+)$/i)?.[1],
    );
  }

  private static cleanSupplierName(message: string): string | undefined {
    const withoutCommand = message
      .replace(
        /\b(create supplier|add supplier|new supplier|register supplier)\b/gi,
        '',
      )
      .replace(
        /\b(crear proveedor|agregar proveedor|nuevo proveedor|registrar proveedor)\b/gi,
        '',
      )
      .trim();

    const nameMatch = withoutCommand.match(
      /^(?:name\s*(?:is|:)?\s*)?["']?(.+?)["']?(?=\s+(?:with|and|nombre|name|contact name|contact|contacto|phone number|phone|telefono|teléfono|tel|email|mail|address|direccion|dirección|notes|notas)\b|$)/i,
    );

    return (
      nameMatch?.[1]
        ?.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, ' ') || undefined
    );
  }

  private static extractUpdateSupplierQuery(
    message: string,
  ): string | undefined {
    const withoutCommand = message
      .replace(/\b(update supplier|edit supplier|modify supplier)\b/gi, '')
      .replace(
        /\b(actualizar proveedor|actualiza proveedor|editar proveedor|edita proveedor|modificar proveedor|modifica proveedor)\b/gi,
        '',
      )
      .trim();

    const match = withoutCommand.match(
      new RegExp(`^(.+?)${this.UPDATE_FIELD_BOUNDARY}`, 'i'),
    );

    return this.cleanValue(match?.[1]);
  }

  private static extractDeleteSupplierQuery(
    message: string,
  ): string | undefined {
    const withoutCommand = message
      .replace(/\b(delete supplier|remove supplier)\b/gi, '')
      .replace(
        /\b(eliminar proveedor|elimina proveedor|borrar proveedor|borra proveedor)\b/gi,
        '',
      )
      .trim();

    return this.cleanValue(withoutCommand);
  }

  private static extractActive(message: string): boolean | undefined {
    if (/\b(active|activo|activar|enable|enabled)\b/i.test(message)) {
      return true;
    }

    if (/\b(inactive|inactivo|desactivar|disable|disabled)\b/i.test(message)) {
      return false;
    }

    return undefined;
  }

  private static cleanValue(value?: string): string | undefined {
    return (
      value
        ?.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, ' ') || undefined
    );
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
