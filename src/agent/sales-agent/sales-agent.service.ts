import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import {
  SalePaymentMethodDto,
  SaleResponseDto,
  SolarisApiService,
} from '../../solaris-client/solaris-api/solaris-api.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import {
  CreateSaleDraft,
  SalesActionExtractor,
} from '../extractors/sales-action.extractor';
import { ReportActionExtractor } from '../extractors/report-action.extractor';
import {
  MAX_LIST_SALES,
  SALES_VOLUME_WARNING_THRESHOLD,
} from './sales-list.constants';

export interface SalesListResult {
  items: SaleResponseDto[];
  totalCount: number;
  volumeThreshold: number;
}

export interface SalesExportReportResult {
  module: 'sales';
  from: string;
  to: string;
  sales: SaleResponseDto[];
  totalCount: number;
}

@Injectable()
export class SalesAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly novaI18n: NovaI18nService,
    private readonly confirmationState: ConfirmationStateService,
  ) {}

  async handleListSales(
    message: string,
    authorization: string | undefined,
    intent: 'list_sales',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const date = SalesActionExtractor.extractListDate(message);

    try {
      const sales = await this.solarisApiService.getSales(authorization);
      let filtered = this.filterSalesByDate(sales, date);

      if (!date) {
        filtered = this.filterSalesByCurrentMonth(filtered);
      }

      const totalCount = filtered.length;
      const items = filtered
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, MAX_LIST_SALES);

      if (totalCount === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'sales.list.empty', {
            dateSuffix: this.formatDateSuffix(date, language),
            scopeSuffix: this.formatScopeSuffix(date, language),
          }),
        };
      }

      let responseMessage = this.novaI18n.t(language, 'sales.list.found', {
        count: items.length,
        totalCount,
        dateSuffix: this.formatDateSuffix(date, language),
        scopeSuffix: this.formatScopeSuffix(date, language),
      });

      if (totalCount > MAX_LIST_SALES) {
        responseMessage += `\n\n${this.novaI18n.t(language, 'sales.list.truncated', {
          shown: items.length,
          total: totalCount,
        })}`;
      }

      if (totalCount > SALES_VOLUME_WARNING_THRESHOLD) {
        responseMessage += `\n\n${this.novaI18n.t(
          language,
          'sales.list.volumeWarning',
          {
            total: totalCount,
            threshold: SALES_VOLUME_WARNING_THRESHOLD,
          },
        )}`;
      }

      const result: SalesListResult = {
        items,
        totalCount,
        volumeThreshold: SALES_VOLUME_WARNING_THRESHOLD,
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
        message: this.novaI18n.t(language, 'sales.list.error'),
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleExportReport(
    message: string,
    authorization: string | undefined,
    intent: 'export_report',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const module = ReportActionExtractor.extractModule(message);

    if (!module) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'reports.missingModule'),
      };
    }

    if (module !== 'sales') {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'reports.moduleNotSupported', {
          module,
        }),
      };
    }

    const { from, to } = ReportActionExtractor.extractDateRange(message);

    try {
      const sales = await this.solarisApiService.getSales(authorization);
      const filtered = this.filterSalesByDateRange(sales, from, to).sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );

      const result: SalesExportReportResult = {
        module: 'sales',
        from,
        to,
        sales: filtered,
        totalCount: filtered.length,
      };

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'reports.sales.ready', {
          count: filtered.length,
          from,
          to,
        }),
        data: result,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'reports.sales.error'),
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleShowSale(
    message: string,
    authorization: string | undefined,
    intent: 'show_sale',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const saleId = SalesActionExtractor.extractSaleId(message);

    if (!saleId) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'sales.show.missingSaleId'),
      };
    }

    try {
      const sale = await this.solarisApiService.getSaleById(
        saleId,
        authorization,
      );

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'sales.show.found', {
          id: sale.id,
        }),
        data: sale,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'sales.show.error'),
        data: {
          saleId,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleDailySalesSummary(
    message: string,
    authorization: string | undefined,
    intent: 'get_daily_sales_summary',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const date = SalesActionExtractor.extractSummaryDate(message);

    try {
      const summary = await this.solarisApiService.getDailySalesSummary(
        authorization,
        date,
      );

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'sales.summary.found', {
          date: summary.date,
          count: summary.salesCount,
          total: summary.totalSales,
        }),
        data: summary,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'sales.summary.error'),
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleCreateSale(
    message: string,
    authorization: string | undefined,
    intent: 'create_sale',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SalesActionExtractor.extractCreateSaleDraft(message);
    const paymentMethod = draft.paymentMethod ?? 'CASH';

    if (draft.items.length === 0) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'sales.create.missingItems'),
        data: draft,
      };
    }

    try {
      const resolvedItems = await Promise.all(
        draft.items.map(async (item) => {
          const products = await this.solarisApiService.smartSearchProducts(
            item.productQuery,
            authorization,
            true,
          );

          if (products.length !== 1) {
            return {
              ...item,
              matches: products,
            };
          }

          const product = products[0];

          return {
            ...item,
            productId: product.id,
            productName: product.name,
          };
        }),
      );

      const unresolvedItems = resolvedItems.filter((item) => !item.productId);

      if (unresolvedItems.length > 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'sales.create.unresolvedProducts',
          ),
          data: unresolvedItems,
        };
      }

      const completedDraft: CreateSaleDraft = {
        paymentMethod,
        items: resolvedItems.map((item) => ({
          productQuery: item.productQuery,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
        })),
      };

      this.confirmationState.savePendingAction({
        type: 'create_sale',
        intent: 'create_sale',
        data: completedDraft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'sales.create.confirm', {
          paymentMethod: this.formatPaymentMethod(paymentMethod, language),
          items: completedDraft.items
            .map((item) => `- ${item.productName} x ${item.quantity}`)
            .join('\n'),
        }),
        data: completedDraft,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'sales.create.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmCreateSale(
    draft: CreateSaleDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    const paymentMethod = draft.paymentMethod ?? 'CASH';

    if (draft.items.length === 0 || draft.items.some((item) => !item.productId)) {
      return {
        type: 'error',
        intent: 'create_sale',
        message: this.novaI18n.t(language, 'sales.create.invalidDraft'),
        data: draft,
      };
    }

    try {
      const result = await this.solarisApiService.createSale(
        {
          paymentMethod,
          items: draft.items.map((item) => ({
            type: 'PRODUCT',
            productId: item.productId!,
            quantity: item.quantity,
          })),
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'create_sale',
        message: this.novaI18n.t(language, 'sales.create.created', {
          id: result.id,
          total: result.totalAmount,
        }),
        data: result,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'create_sale',
        message: this.novaI18n.t(language, 'sales.create.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private formatPaymentMethod(
    paymentMethod: SalePaymentMethodDto,
    language: string,
  ): string {
    const key = `sales.paymentMethod.${paymentMethod}`;

    return this.novaI18n.t(language, key);
  }

  private filterSalesByDate(
    sales: SaleResponseDto[],
    date?: string,
  ): SaleResponseDto[] {
    if (!date) {
      return sales;
    }

    return sales.filter((sale) => sale.createdAt.startsWith(date));
  }

  private filterSalesByDateRange(
    sales: SaleResponseDto[],
    from: string,
    to: string,
  ): SaleResponseDto[] {
    return sales.filter((sale) => {
      const saleDate = sale.createdAt.split('T')[0];

      return saleDate >= from && saleDate <= to;
    });
  }

  private filterSalesByCurrentMonth(
    sales: SaleResponseDto[],
  ): SaleResponseDto[] {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    ).padStart(2, '0')}`;

    return this.filterSalesByDateRange(sales, monthStart, monthEnd);
  }

  private formatScopeSuffix(date: string | undefined, language: string): string {
    if (date) {
      return '';
    }

    return language.startsWith('es')
      ? ' del mes en curso'
      : ' for the current month';
  }

  private formatDateSuffix(date: string | undefined, language: string): string {
    if (!date) {
      return '';
    }

    return language.startsWith('es') ? ` del ${date}` : ` on ${date}`;
  }
}
