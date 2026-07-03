import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import {
  EmitInvoiceDraft,
  FiscalActionExtractor,
} from '../extractors/fiscal-action.extractor';

const MAX_LIST_DOCUMENTS = 15;

@Injectable()
export class FiscalAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly novaI18n: NovaI18nService,
    private readonly confirmationState: ConfirmationStateService,
  ) {}

  async handleListFiscalDocuments(
    authorization: string | undefined,
    intent: 'list_fiscal_documents',
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const documents = await this.solarisApiService.getFiscalDocuments(
        authorization,
      );
      const results = documents.slice(0, MAX_LIST_DOCUMENTS);

      if (results.length === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'fiscalDocuments.list.empty'),
        };
      }

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.list.found', {
          count: results.length,
        }),
        data: results,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.list.error'),
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleShowFiscalDocument(
    message: string,
    authorization: string | undefined,
    intent: 'show_fiscal_document',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const documentId = FiscalActionExtractor.extractFiscalDocumentId(message);

    if (!documentId) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'fiscalDocuments.show.missingDocumentId',
        ),
      };
    }

    try {
      const document = await this.solarisApiService.getFiscalDocumentById(
        documentId,
        authorization,
      );

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.show.found', {
          id: document.id,
        }),
        data: document,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.show.error'),
        data: {
          documentId,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleEmitInvoice(
    message: string,
    authorization: string | undefined,
    intent: 'emit_invoice',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = FiscalActionExtractor.extractEmitInvoiceDraft(message);

    if (!draft.saleId) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.emit.missingSaleId'),
      };
    }

    try {
      const sale = await this.solarisApiService.getSaleById(
        draft.saleId,
        authorization,
      );

      if (sale.invoiced) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'fiscalDocuments.emit.alreadyInvoiced', {
            id: sale.id,
          }),
        };
      }

      let customerId = draft.customerId;
      let customerName: string | undefined;

      if (!customerId && draft.customerQuery) {
        const customers = await this.solarisApiService.smartSearchCustomers(
          draft.customerQuery,
          authorization,
        );

        if (customers.length === 0) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(language, 'customers.search.notFound', {
              query: draft.customerQuery,
            }),
          };
        }

        if (customers.length > 1) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(
              language,
              'fiscalDocuments.emit.multipleCustomers',
              {
                query: draft.customerQuery,
              },
            ),
            data: customers,
          };
        }

        customerId = customers[0].id;
        customerName = customers[0].razonSocial;
      }

      if (customerId && !customerName) {
        const customer = await this.solarisApiService.getCustomerById(
          customerId,
          authorization,
        );
        customerName = customer.razonSocial;
      }

      const completedDraft: EmitInvoiceDraft = {
        saleId: sale.id,
        customerId,
      };

      this.confirmationState.savePendingAction({
        type: 'emit_invoice',
        intent: 'emit_invoice',
        data: completedDraft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.emit.confirm', {
          saleId: sale.id,
          total: sale.totalAmount,
          customer: customerName ?? this.novaI18n.t(language, 'fiscalDocuments.emit.defaultCustomer'),
        }),
        data: completedDraft,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'fiscalDocuments.emit.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmEmitInvoice(
    draft: EmitInvoiceDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.saleId) {
      return {
        type: 'error',
        intent: 'emit_invoice',
        message: this.novaI18n.t(language, 'fiscalDocuments.emit.invalidDraft'),
        data: draft,
      };
    }

    try {
      const result = await this.solarisApiService.emitInvoiceForSale(
        draft.saleId,
        draft.customerId ? { customerId: draft.customerId } : {},
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'emit_invoice',
        message: this.novaI18n.t(language, 'fiscalDocuments.emit.created', {
          id: result.id,
          status: result.status,
        }),
        data: result,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'emit_invoice',
        message: this.novaI18n.t(language, 'fiscalDocuments.emit.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
