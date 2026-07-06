import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import {
  FiscalDocumentResponseDto,
  SolarisApiService,
} from '../../solaris-client/solaris-api/solaris-api.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import {
  EmitInvoiceDraft,
  FiscalActionExtractor,
} from '../extractors/fiscal-action.extractor';
import {
  FISCAL_VOLUME_WARNING_THRESHOLD,
  MAX_LIST_FISCAL_DOCUMENTS,
} from './fiscal-list.constants';

export interface FiscalDocumentsListResult {
  items: FiscalDocumentResponseDto[];
  totalCount: number;
  volumeThreshold: number;
}

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
      const filtered = this.filterDocumentsByCurrentMonth(documents);
      const totalCount = filtered.length;
      const items = filtered
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, MAX_LIST_FISCAL_DOCUMENTS);

      if (totalCount === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'fiscalDocuments.list.empty', {
            scopeSuffix: this.formatScopeSuffix(language),
          }),
        };
      }

      let responseMessage = this.novaI18n.t(
        language,
        'fiscalDocuments.list.found',
        {
          count: items.length,
          totalCount,
          scopeSuffix: this.formatScopeSuffix(language),
        },
      );

      if (totalCount > MAX_LIST_FISCAL_DOCUMENTS) {
        responseMessage += `\n\n${this.novaI18n.t(
          language,
          'fiscalDocuments.list.truncated',
          {
            shown: items.length,
            total: totalCount,
          },
        )}`;
      }

      if (totalCount > FISCAL_VOLUME_WARNING_THRESHOLD) {
        responseMessage += `\n\n${this.novaI18n.t(
          language,
          'fiscalDocuments.list.volumeWarning',
          {
            total: totalCount,
            threshold: FISCAL_VOLUME_WARNING_THRESHOLD,
          },
        )}`;
      }

      const result: FiscalDocumentsListResult = {
        items,
        totalCount,
        volumeThreshold: FISCAL_VOLUME_WARNING_THRESHOLD,
      };

      return {
        type: 'tool_result',
        intent,
        message: responseMessage,
        data: result,
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

  private filterDocumentsByCurrentMonth(
    documents: FiscalDocumentResponseDto[],
  ): FiscalDocumentResponseDto[] {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    ).padStart(2, '0')}`;

    return documents.filter((document) => {
      const documentDate = document.createdAt.split('T')[0];

      return documentDate >= monthStart && documentDate <= monthEnd;
    });
  }

  private formatScopeSuffix(language: string): string {
    return language.startsWith('es')
      ? ' del mes en curso'
      : ' for the current month';
  }
}
