import type {
  CustomerCondicionIvaDto,
  CustomerDocumentTypeDto,
} from '../../solaris-client/solaris-api/solaris-api.service';

export interface CreateCustomerDraft {
  razonSocial?: string;
  documentType?: CustomerDocumentTypeDto;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  condicionIva?: CustomerCondicionIvaDto;
}

export interface UpdateCustomerDraft {
  customerQuery?: string;
  customerId?: number;
  customerName?: string;
  razonSocial?: string;
  documentType?: CustomerDocumentTypeDto;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  condicionIva?: CustomerCondicionIvaDto;
}

export interface DeactivateCustomerDraft {
  customerQuery?: string;
  customerId?: number;
  customerName?: string;
}

export class CustomerActionExtractor {
  private static readonly UPDATE_FIELD_BOUNDARY =
    '(?=\\s+(?:with|and|nombre|name|razon social|razón social|document|documento|cuit|cuil|dni|email|mail|phone|telefono|teléfono|tel|address|direccion|dirección|condicion iva|condición iva|iva)\\b|$)';

  static extractCustomerId(message: string): number | undefined {
    const match = message.match(
      /(?:cliente|customer)\s*(?:#|nro\.?|num\.?|number)?\s*(\d+)/i,
    );

    const id = Number(match?.[1]);

    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  static extractSearchQuery(message: string): string | undefined {
    const patterns = [
      /(?:buscar|busca|mostrar|muestra|ver|search|find|show)\s+(?:cliente|customer)\s+(.+)/i,
      /(?:cliente|customer)\s+(?:llamado|named|de nombre)?\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);

      if (match?.[1]?.trim()) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  static extractCreateCustomerDraft(message: string): CreateCustomerDraft {
    const normalized = message.trim();

    return {
      razonSocial: this.extractRazonSocial(normalized),
      documentType: this.extractDocumentType(normalized),
      documentNumber: this.extractDocumentNumber(normalized),
      email: this.extractEmail(normalized),
      phone: this.extractPhone(normalized),
      address: this.extractAddress(normalized),
      condicionIva: this.extractCondicionIva(normalized),
    };
  }

  static extractUpdateCustomerDraft(message: string): UpdateCustomerDraft {
    const normalized = message.trim();

    return {
      customerQuery: this.extractUpdateCustomerQuery(normalized),
      razonSocial: this.extractRazonSocialField(normalized),
      documentType: this.extractDocumentType(normalized),
      documentNumber: this.extractDocumentNumber(normalized),
      email: this.extractEmail(normalized),
      phone: this.extractPhone(normalized),
      address: this.extractAddress(normalized),
      condicionIva: this.extractCondicionIva(normalized),
    };
  }

  static extractDeactivateCustomerDraft(
    message: string,
  ): DeactivateCustomerDraft {
    return {
      customerQuery: this.extractDeactivateCustomerQuery(message),
    };
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

  private static extractDocumentType(
    message: string,
  ): CustomerDocumentTypeDto | undefined {
    if (/\b(cuit)\b/i.test(message)) {
      return 'CUIT';
    }

    if (/\b(cuil)\b/i.test(message)) {
      return 'CUIL';
    }

    if (/\b(dni)\b/i.test(message)) {
      return 'DNI';
    }

    return undefined;
  }

  private static extractDocumentNumber(message: string): string | undefined {
    const labeledMatch = message.match(
      new RegExp(
        `(?:document(?: number|o)?|documento|cuit|cuil|dni)\\s*(?:is|es|:)?\\s*([0-9\\-]+)${this.UPDATE_FIELD_BOUNDARY}`,
        'i',
      ),
    );

    if (labeledMatch?.[1]) {
      return this.cleanValue(labeledMatch[1]);
    }

    const standaloneMatch = message.match(/\b(\d{7,11})\b/);

    return standaloneMatch?.[1];
  }

  private static extractCondicionIva(
    message: string,
  ): CustomerCondicionIvaDto | undefined {
    const normalized = message.toLowerCase();

    if (
      /\b(responsable inscripto|responsable_inscripto|resp\.?\s*inscripto|ri)\b/.test(
        normalized,
      )
    ) {
      return 'RESPONSABLE_INSCRIPTO';
    }

    if (/\b(monotributo|mono)\b/.test(normalized)) {
      return 'MONOTRIBUTO';
    }

    if (/\b(exento)\b/.test(normalized)) {
      return 'EXENTO';
    }

    if (/\b(consumidor final|consumidor_final|cf)\b/.test(normalized)) {
      return 'CONSUMIDOR_FINAL';
    }

    if (/\b(no categorizado|no_categorizado)\b/.test(normalized)) {
      return 'NO_CATEGORIZADO';
    }

    return undefined;
  }

  private static extractRazonSocial(message: string): string | undefined {
    const withoutCommand = message
      .replace(
        /\b(create customer|add customer|new customer|register customer)\b/gi,
        '',
      )
      .replace(
        /\b(crear cliente|agregar cliente|nuevo cliente|registrar cliente)\b/gi,
        '',
      )
      .trim();

    const nameMatch = withoutCommand.match(
      new RegExp(
        `(?:razon social|razón social|nombre|name)\\s*(?:is|es|:)?\\s*["']?(.+?)["']?${this.UPDATE_FIELD_BOUNDARY}`,
        'i',
      ),
    );

    if (nameMatch?.[1]) {
      return this.cleanValue(nameMatch[1]);
    }

    const leadingName = withoutCommand.match(
      /^["']?(.+?)["']?(?=\s+(?:with|and|document|documento|cuit|cuil|dni|email|mail|phone|telefono|teléfono|tel|address|direccion|dirección|condicion iva|condición iva|iva)\b|$)/i,
    );

    return this.cleanValue(leadingName?.[1]);
  }

  private static extractRazonSocialField(message: string): string | undefined {
    return this.cleanValue(
      message.match(
        new RegExp(
          `(?:razon social|razón social|nombre|name)\\s*(?:is|es|:)?\\s+(.+?)${this.UPDATE_FIELD_BOUNDARY}`,
          'i',
        ),
      )?.[1],
    );
  }

  private static extractUpdateCustomerQuery(
    message: string,
  ): string | undefined {
    const withoutCommand = message
      .replace(/\b(update customer|edit customer|modify customer)\b/gi, '')
      .replace(
        /\b(actualizar cliente|actualiza cliente|editar cliente|edita cliente|modificar cliente|modifica cliente)\b/gi,
        '',
      )
      .trim();

    const match = withoutCommand.match(
      new RegExp(`^(.+?)${this.UPDATE_FIELD_BOUNDARY}`, 'i'),
    );

    return this.cleanValue(match?.[1]);
  }

  private static extractDeactivateCustomerQuery(
    message: string,
  ): string | undefined {
    const withoutCommand = message
      .replace(/\b(delete customer|remove customer|deactivate customer)\b/gi, '')
      .replace(
        /\b(eliminar cliente|elimina cliente|borrar cliente|borra cliente|desactivar cliente|desactiva cliente|dar de baja cliente)\b/gi,
        '',
      )
      .trim();

    return this.cleanValue(withoutCommand);
  }

  private static cleanValue(value?: string): string | undefined {
    return (
      value
        ?.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, ' ') || undefined
    );
  }
}
