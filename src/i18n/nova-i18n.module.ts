import { Module } from '@nestjs/common';
import { NovaI18nService } from './nova-i18n/nova-i18n.service';

@Module({
  providers: [NovaI18nService],
  exports: [NovaI18nService],
})
export class NovaI18nModule {}
