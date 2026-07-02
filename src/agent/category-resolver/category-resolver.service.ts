import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryResolverService {
  private readonly aliases: Record<string, string> = {
    drinks: 'Bebidas',
    beverages: 'Bebidas',
    beverage: 'Bebidas',
    bebidas: 'Bebidas',

    general: 'General',
    default: 'General',
    'default category': 'General',
  };

  resolveCategoryName(categoryName: string): string {
    const normalized = categoryName.trim().toLowerCase();

    return this.aliases[normalized] ?? categoryName.trim();
  }
}
