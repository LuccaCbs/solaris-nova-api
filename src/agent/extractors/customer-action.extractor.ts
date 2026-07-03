export class CustomerActionExtractor {
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
}
