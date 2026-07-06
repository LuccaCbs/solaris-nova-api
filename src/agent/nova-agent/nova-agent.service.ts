import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { IntentClassifierService } from '../intent-classifier/intent-classifier.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { GeminiAgentService } from '../gemini-agent/gemini-agent.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { SupplierAgentService } from '../supplier-agent/supplier-agent.service';
import { ProductAgentService } from '../product-agent/product-agent.service';
import { CategoryAgentService } from '../category-agent/category-agent.service';
import { SupplierOrderAgentService } from '../supplier-order-agent/supplier-order-agent.service';
import { SalesAgentService } from '../sales-agent/sales-agent.service';
import { CustomerAgentService } from '../customer-agent/customer-agent.service';
import { FiscalAgentService } from '../fiscal-agent/fiscal-agent.service';
import {
  UpdateStockDraft,
  CreateCategoryDraft,
  UpdateProductDraft,
  DeactivateProductDraft,
  ActivateProductDraft,
} from '../extractors/product-action.extractor';
import {
  CreateSupplierDraft,
  UpdateSupplierDraft,
  DeleteSupplierDraft,
} from '../extractors/supplier-action.extractor';
import {
  CreateSupplierOrderDraft,
  SupplierOrderActionDraft,
  UpdateSupplierOrderDraft,
} from '../extractors/supplier-order-action.extractor';
import { CreateSaleDraft } from '../extractors/sales-action.extractor';
import { EmitInvoiceDraft } from '../extractors/fiscal-action.extractor';
import {
  CreateCustomerDraft,
  DeactivateCustomerDraft,
  UpdateCustomerDraft,
} from '../extractors/customer-action.extractor';
@Injectable()
export class NovaAgentService {
  constructor(
    private readonly intentClassifier: IntentClassifierService,
    private readonly confirmationState: ConfirmationStateService,
    private readonly solarisApiService: SolarisApiService,
    private readonly geminiAgentService: GeminiAgentService,
    private readonly novaI18n: NovaI18nService,
    private readonly supplierAgentService: SupplierAgentService,
    private readonly productAgentService: ProductAgentService,
    private readonly categoryAgentService: CategoryAgentService,
    private readonly supplierOrderAgentService: SupplierOrderAgentService,
    private readonly salesAgentService: SalesAgentService,
    private readonly customerAgentService: CustomerAgentService,
    private readonly fiscalAgentService: FiscalAgentService,
  ) {}

  resetConversation(language = 'es'): ChatResponseDto {
    this.confirmationState.clearPendingAction();

    return {
      type: 'message',
      message: this.novaI18n.t(language, 'conversation.restarted'),
    };
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  async processMessage(
    message: string,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    const pendingAction = this.confirmationState.getPendingAction();

    if (pendingAction && this.confirmationState.isCancellation(message)) {
      this.confirmationState.clearPendingAction();

      return {
        type: 'message',
        intent: pendingAction.intent,
        message: this.novaI18n.t(language, 'conversation.cancelled'),
      };
    }

    if (pendingAction && this.confirmationState.isConfirmation(message)) {
      if (pendingAction.intent === 'update_product') {
        return this.productAgentService.confirmUpdateProduct(
          pendingAction.data as UpdateProductDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'deactivate_product') {
        return this.productAgentService.confirmDeactivateProduct(
          pendingAction.data as DeactivateProductDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'activate_product') {
        return this.productAgentService.confirmActivateProduct(
          pendingAction.data as ActivateProductDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'update_stock') {
        return this.productAgentService.confirmUpdateStock(
          pendingAction.data as UpdateStockDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'create_category') {
        return this.categoryAgentService.confirmCreateCategory(
          pendingAction.data as CreateCategoryDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'create_supplier') {
        return this.supplierAgentService.confirmCreateSupplier(
          pendingAction.data as CreateSupplierDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'update_supplier') {
        return this.supplierAgentService.confirmUpdateSupplier(
          pendingAction.data as UpdateSupplierDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'delete_supplier') {
        return this.supplierAgentService.confirmDeleteSupplier(
          pendingAction.data as DeleteSupplierDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'create_supplier_order') {
        return this.supplierOrderAgentService.confirmCreateSupplierOrder(
          pendingAction.data as CreateSupplierOrderDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'complete_supplier_order') {
        return this.supplierOrderAgentService.confirmCompleteSupplierOrder(
          pendingAction.data as SupplierOrderActionDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'cancel_supplier_order') {
        return this.supplierOrderAgentService.confirmCancelSupplierOrder(
          pendingAction.data as SupplierOrderActionDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'delete_supplier_order') {
        return this.supplierOrderAgentService.confirmDeleteSupplierOrder(
          pendingAction.data as SupplierOrderActionDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'update_supplier_order') {
        return this.supplierOrderAgentService.confirmUpdateSupplierOrder(
          pendingAction.data as UpdateSupplierOrderDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'create_sale') {
        return this.salesAgentService.confirmCreateSale(
          pendingAction.data as CreateSaleDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'emit_invoice') {
        return this.fiscalAgentService.confirmEmitInvoice(
          pendingAction.data as EmitInvoiceDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'create_customer') {
        return this.customerAgentService.confirmCreateCustomer(
          pendingAction.data as CreateCustomerDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'update_customer') {
        return this.customerAgentService.confirmUpdateCustomer(
          pendingAction.data as UpdateCustomerDraft,
          authorization,
          language,
        );
      }

      if (pendingAction.intent === 'deactivate_customer') {
        return this.customerAgentService.confirmDeactivateCustomer(
          pendingAction.data as DeactivateCustomerDraft,
          authorization,
          language,
        );
      }

      return this.productAgentService.confirmCreateProduct(
        pendingAction,
        authorization,
        language,
      );
    }
    let geminiFields: Record<string, unknown> | undefined = undefined;

    let intent = this.intentClassifier.classify(message);
    const ruleBasedIntent = intent;

    try {
      const geminiResult =
        await this.geminiAgentService.analyzeMessage(message);

      if (
        ruleBasedIntent === 'unknown' &&
        typeof geminiResult.confidence === 'number' &&
        geminiResult.confidence >= 0.75
      ) {
        intent = geminiResult.intent;
      }

      geminiFields =
        geminiResult.extracted_fields ?? geminiResult.fields ?? undefined;
    } catch (error: unknown) {
      console.warn('Gemini unavailable, using rule-based fallback.', error);
    }
    console.log('Nova intent:', intent);
    switch (intent) {
      case 'create_product':
        return this.productAgentService.handleCreateProduct(
          message,
          authorization,
          intent,
          geminiFields,
          language,
        );

      case 'update_product':
        return this.productAgentService.handleUpdateProduct(
          message,
          authorization,
          intent,
          language,
        );

      case 'deactivate_product':
        return this.productAgentService.handleDeactivateProduct(
          message,
          authorization,
          intent,
          language,
        );

      case 'activate_product':
        return this.productAgentService.handleActivateProduct(
          message,
          authorization,
          intent,
          language,
        );

      case 'search_product':
        return this.productAgentService.handleSearchProduct(
          message,
          authorization,
          intent,
          language,
        );

      case 'update_stock':
        return this.productAgentService.handleUpdateStock(
          message,
          authorization,
          intent,
          language,
        );

      case 'list_low_stock':
        return this.productAgentService.handleListLowStockProducts(
          authorization,
          intent,
          language,
        );

      case 'create_category':
        return this.categoryAgentService.handleCreateCategory(
          message,
          intent,
          geminiFields,
          language,
        );

      case 'create_supplier':
        return this.supplierAgentService.handleCreateSupplier(
          message,
          intent,
          geminiFields,
          language,
        );

      case 'search_supplier':
        return this.supplierAgentService.handleSearchSupplier(
          message,
          authorization,
          intent,
          language,
        );

      case 'update_supplier':
        return this.supplierAgentService.handleUpdateSupplier(
          message,
          authorization,
          intent,
          language,
        );

      case 'delete_supplier':
        return this.supplierAgentService.handleDeleteSupplier(
          message,
          authorization,
          intent,
          language,
        );

      case 'create_supplier_order':
        return this.supplierOrderAgentService.handleCreateSupplierOrder(
          message,
          authorization,
          intent,
          language,
        );

      case 'show_supplier_order':
        return this.supplierOrderAgentService.handleShowSupplierOrder(
          message,
          authorization,
          intent,
          language,
        );

      case 'mark_supplier_order_sent':
        return this.supplierOrderAgentService.handleMarkSupplierOrderSent(
          message,
          authorization,
          intent,
          language,
        );

      case 'complete_supplier_order':
        return this.supplierOrderAgentService.handleCompleteSupplierOrder(
          message,
          authorization,
          intent,
          language,
        );

      case 'cancel_supplier_order':
        return this.supplierOrderAgentService.handleCancelSupplierOrder(
          message,
          authorization,
          intent,
          language,
        );

      case 'delete_supplier_order':
        return this.supplierOrderAgentService.handleDeleteSupplierOrder(
          message,
          authorization,
          intent,
          language,
        );

      case 'update_supplier_order':
        return this.supplierOrderAgentService.handleUpdateSupplierOrder(
          message,
          authorization,
          intent,
          language,
        );

      case 'get_dashboard_summary':
        return this.handleGetDashboardSummary(authorization, intent, language);

      case 'list_sales':
        return this.salesAgentService.handleListSales(
          message,
          authorization,
          intent,
          language,
        );

      case 'show_sale':
        return this.salesAgentService.handleShowSale(
          message,
          authorization,
          intent,
          language,
        );

      case 'get_daily_sales_summary':
        return this.salesAgentService.handleDailySalesSummary(
          message,
          authorization,
          intent,
          language,
        );

      case 'export_report':
        return this.salesAgentService.handleExportReport(
          message,
          authorization,
          intent,
          language,
        );

      case 'search_customer':
        return this.customerAgentService.handleSearchCustomer(
          message,
          authorization,
          intent,
          language,
        );

      case 'create_customer':
        return this.customerAgentService.handleCreateCustomer(
          message,
          intent,
          geminiFields,
          language,
        );

      case 'update_customer':
        return this.customerAgentService.handleUpdateCustomer(
          message,
          authorization,
          intent,
          language,
        );

      case 'deactivate_customer':
        return this.customerAgentService.handleDeactivateCustomer(
          message,
          authorization,
          intent,
          language,
        );

      case 'show_customer':
        return this.customerAgentService.handleShowCustomer(
          message,
          authorization,
          intent,
          language,
        );

      case 'list_fiscal_documents':
        return this.fiscalAgentService.handleListFiscalDocuments(
          authorization,
          intent,
          language,
        );

      case 'show_fiscal_document':
        return this.fiscalAgentService.handleShowFiscalDocument(
          message,
          authorization,
          intent,
          language,
        );

      case 'create_sale':
        return this.salesAgentService.handleCreateSale(
          message,
          authorization,
          intent,
          language,
        );

      case 'emit_invoice':
        return this.fiscalAgentService.handleEmitInvoice(
          message,
          authorization,
          intent,
          language,
        );

      default:
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'conversation.unknownIntent'),
        };
    }
  }

  /*HANDLERS-START*/

  private async handleGetDashboardSummary(
    authorization: string | undefined,
    intent: 'get_dashboard_summary',
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const dashboard =
        await this.solarisApiService.getDashboardSummary(authorization);

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'dashboard.summary', {
          todaySalesCount: dashboard.todaySalesCount,
          todaySalesAmount: dashboard.todaySalesAmount,
          lowStockProductsCount: dashboard.lowStockProductsCount,
          sent: dashboard.supplierOrders.sent,
          completed: dashboard.supplierOrders.completed,
          cancelled: dashboard.supplierOrders.cancelled,
        }),
        data: dashboard,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'dashboard.error'),
        data: {
          errorMessage,
        },
      };
    }
  }

  /*HANDLERS-END*/
}
