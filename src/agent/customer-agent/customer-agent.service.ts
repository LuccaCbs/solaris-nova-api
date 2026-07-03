import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { CustomerActionExtractor } from '../extractors/customer-action.extractor';

const MAX_SEARCH_RESULTS = 10;

@Injectable()
export class CustomerAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly novaI18n: NovaI18nService,
  ) {}

  async handleSearchCustomer(
    message: string,
    authorization: string | undefined,
    intent: 'search_customer',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const query = CustomerActionExtractor.extractSearchQuery(message);

    if (!query) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'customers.search.askQuery'),
      };
    }

    try {
      const customers = await this.solarisApiService.smartSearchCustomers(
        query,
        authorization,
      );

      const results = customers.slice(0, MAX_SEARCH_RESULTS);

      if (results.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'customers.search.notFound', {
            query,
          }),
          data: [],
        };
      }

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'customers.search.found', {
          count: results.length,
          query,
        }),
        data: results.length === 1 ? results[0] : results,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'customers.search.error'),
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleShowCustomer(
    message: string,
    authorization: string | undefined,
    intent: 'show_customer',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const customerId = CustomerActionExtractor.extractCustomerId(message);

    if (!customerId) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'customers.show.missingCustomerId'),
      };
    }

    try {
      const customer = await this.solarisApiService.getCustomerById(
        customerId,
        authorization,
      );

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'customers.show.found', {
          id: customer.id,
        }),
        data: customer,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'customers.show.error'),
        data: {
          customerId,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
