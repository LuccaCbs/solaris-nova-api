import { Injectable } from '@nestjs/common';
import { es } from '../locales/es';
import { en } from '../locales/en';
import { fr } from '../locales/fr';
import { ca } from '../locales/ca';

type TranslationParams = Record<string, string | number>;

@Injectable()
export class NovaI18nService {
  private readonly dictionaries = {
    es,
    en,
    fr,
    ca,
  };

  t(language: string | undefined, key: string, params: TranslationParams = {}) {
    const lang = this.resolveLanguage(language);
    const dictionary = this.dictionaries[lang] ?? this.dictionaries.es;

    const template =
      this.getNestedValue(dictionary, key) ??
      this.getNestedValue(this.dictionaries.es, key) ??
      this.getNestedValue(this.dictionaries.en, key) ??
      key;

    return this.interpolate(template, params);
  }

  private resolveLanguage(language?: string): keyof typeof this.dictionaries {
    const normalized = language?.toLowerCase() ?? 'es';

    if (normalized.startsWith('en')) return 'en';
    if (normalized.startsWith('fr')) return 'fr';
    if (normalized.startsWith('ca') || normalized.startsWith('mq')) return 'ca';

    return 'es';
  }

  private getNestedValue(source: object, key: string): string | undefined {
    return key.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part];
      }

      return undefined;
    }, source) as string | undefined;
  }

  private interpolate(template: string, params: TranslationParams) {
    return Object.entries(params).reduce(
      (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}
