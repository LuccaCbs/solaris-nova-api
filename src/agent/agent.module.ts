import { Module } from '@nestjs/common';
import { NovaAgentService } from './nova-agent/nova-agent.service';
import { IntentClassifierService } from './intent-classifier/intent-classifier.service';
import { ConfirmationStateService } from './confirmation-state/confirmation-state.service';
import { SolarisClientModule } from '../solaris-client/solaris-client.module';
import { GeminiAgentService } from './gemini-agent/gemini-agent.service';
import { CategoryResolverService } from './category-resolver/category-resolver.service';
import { NovaI18nModule } from '../i18n/nova-i18n.module';
import { SupplierAgentService } from './supplier-agent/supplier-agent.service';
import { ProductAgentService } from './product-agent/product-agent.service';
import { CategoryAgentService } from './category-agent/category-agent.service';
import { SupplierOrderAgentService } from './supplier-order-agent/supplier-order-agent.service';
import { SalesAgentService } from './sales-agent/sales-agent.service';

@Module({
  imports: [SolarisClientModule, NovaI18nModule],
  providers: [
    NovaAgentService,
    IntentClassifierService,
    ConfirmationStateService,
    GeminiAgentService,
    CategoryResolverService,
    SupplierAgentService,
    ProductAgentService,
    CategoryAgentService,
    SupplierOrderAgentService,
    SalesAgentService,
  ],
  exports: [NovaAgentService, GeminiAgentService],
})
export class AgentModule {}
