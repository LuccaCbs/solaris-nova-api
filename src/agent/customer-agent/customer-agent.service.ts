import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import {
  CreateCustomerDraft,
  CustomerActionExtractor,
  DeactivateCustomerDraft,
  UpdateCustomerDraft,
} from '../extractors/customer-action.extractor';

const MAX_SEARCH_RESULTS = 10;

@Injectable()
export class CustomerAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly confirmationState: ConfirmationStateService,
    private readonly novaI18n: NovaI18nService,
  ) {}

  handleCreateCustomer(
    message: string,
    intent: 'create_customer',
    geminiFields?: Record<string, unknown>,
    language = 'es',
  ): ChatResponseDto {
    const draftFromRegex =
      CustomerActionExtractor.extractCreateCustomerDraft(message);

    const draft: CreateCustomerDraft = {
      razonSocial:
        typeof geminiFields?.razonSocial === 'string'
          ? geminiFields.razonSocial
          : typeof geminiFields?.name === 'string'
            ? geminiFields.name
            : draftFromRegex.razonSocial,
      documentType:
        typeof geminiFields?.documentType === 'string'
          ? (geminiFields.documentType as CreateCustomerDraft['documentType'])
          : draftFromRegex.documentType,
      documentNumber:
        typeof geminiFields?.documentNumber === 'string'
          ? geminiFields.documentNumber
          : draftFromRegex.documentNumber,
      email:
        typeof geminiFields?.email === 'string'
          ? geminiFields.email
          : draftFromRegex.email,
      phone:
        typeof geminiFields?.phone === 'string'
          ? geminiFields.phone
          : draftFromRegex.phone,
      address:
        typeof geminiFields?.address === 'string'
          ? geminiFields.address
          : draftFromRegex.address,
      condicionIva:
        typeof geminiFields?.condicionIva === 'string'
          ? (geminiFields.condicionIva as CreateCustomerDraft['condicionIva'])
          : draftFromRegex.condicionIva,
    };

    if (!draft.razonSocial) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'customers.create.missingName'),
        data: draft,
      };
    }

    if (!draft.documentNumber) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'customers.create.missingDocumentNumber',
        ),
        data: draft,
      };
    }

    const documentType = draft.documentType ?? 'DNI';
    const condicionIva = draft.condicionIva ?? 'CONSUMIDOR_FINAL';

    const normalizedDraft: CreateCustomerDraft = {
      ...draft,
      documentType,
      condicionIva,
    };

    this.confirmationState.savePendingAction({
      type: 'create_customer',
      intent: 'create_customer',
      data: normalizedDraft,
      createdAt: new Date(),
    });

    return {
      type: 'confirmation',
      intent,
      message: this.novaI18n.t(language, 'customers.create.confirm', {
        razonSocial: normalizedDraft.razonSocial!,
        documentType,
        documentNumber: normalizedDraft.documentNumber!,
        email: normalizedDraft.email ?? '-',
        phone: normalizedDraft.phone ?? '-',
        condicionIva,
      }),
      data: normalizedDraft,
    };
  }

  async confirmCreateCustomer(
    draft: CreateCustomerDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const result = await this.solarisApiService.createCustomer(
        {
          documentType: draft.documentType ?? 'DNI',
          documentNumber: draft.documentNumber!,
          razonSocial: draft.razonSocial!,
          email: draft.email,
          phone: draft.phone,
          address: draft.address,
          condicionIva: draft.condicionIva ?? 'CONSUMIDOR_FINAL',
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'create_customer',
        message: this.novaI18n.t(language, 'customers.create.created'),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'create_customer',
        this.novaI18n.t(language, 'customers.create.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

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
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'customers.search.error'),
        { query, errorMessage: this.getErrorMessage(error) },
      );
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
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'customers.show.error'),
        { customerId, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async handleUpdateCustomer(
    message: string,
    authorization: string | undefined,
    intent: 'update_customer',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = CustomerActionExtractor.extractUpdateCustomerDraft(message);

    if (!draft.customerQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'customers.update.missingCustomer'),
        data: draft,
      };
    }

    const hasUpdates =
      draft.razonSocial !== undefined ||
      draft.documentType !== undefined ||
      draft.documentNumber !== undefined ||
      draft.email !== undefined ||
      draft.phone !== undefined ||
      draft.address !== undefined ||
      draft.condicionIva !== undefined;

    if (!hasUpdates) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'customers.update.missingFields'),
        data: draft,
      };
    }

    try {
      const customers = await this.solarisApiService.smartSearchCustomers(
        draft.customerQuery,
        authorization,
      );

      const matchedCustomers = this.preferExactCustomerMatches(
        customers,
        draft.customerQuery,
      );

      if (matchedCustomers.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'customers.search.notFound', {
            query: draft.customerQuery,
          }),
          data: [],
        };
      }

      if (matchedCustomers.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'customers.update.multipleCustomers',
            { query: draft.customerQuery },
          ),
          data: matchedCustomers,
        };
      }

      const customer = matchedCustomers[0];

      const pendingDraft: UpdateCustomerDraft = {
        ...draft,
        customerId: customer.id,
        customerName: customer.razonSocial,
      };

      this.confirmationState.savePendingAction({
        type: 'update_customer',
        intent: 'update_customer',
        data: pendingDraft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'customers.update.confirm', {
          name: customer.razonSocial,
          razonSocial: draft.razonSocial ?? customer.razonSocial,
          documentType: draft.documentType ?? customer.documentType,
          documentNumber: draft.documentNumber ?? customer.documentNumber,
          email: draft.email ?? customer.email ?? '-',
          phone: draft.phone ?? customer.phone ?? '-',
          address: draft.address ?? customer.address ?? '-',
          condicionIva: draft.condicionIva ?? customer.condicionIva,
        }),
        data: pendingDraft,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'customers.update.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async confirmUpdateCustomer(
    draft: UpdateCustomerDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.customerId) {
      return {
        type: 'error',
        intent: 'update_customer',
        message: this.novaI18n.t(language, 'customers.update.missingCustomer'),
        data: draft,
      };
    }

    try {
      const customer = await this.solarisApiService.getCustomerById(
        draft.customerId,
        authorization,
      );

      const result = await this.solarisApiService.updateCustomer(
        draft.customerId,
        {
          documentType: draft.documentType ?? customer.documentType,
          documentNumber: draft.documentNumber ?? customer.documentNumber,
          razonSocial: draft.razonSocial ?? customer.razonSocial,
          email: draft.email ?? customer.email ?? undefined,
          phone: draft.phone ?? customer.phone ?? undefined,
          address: draft.address ?? customer.address ?? undefined,
          condicionIva: draft.condicionIva ?? customer.condicionIva,
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'update_customer',
        message: this.novaI18n.t(language, 'customers.update.updated'),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'update_customer',
        this.novaI18n.t(language, 'customers.update.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async handleDeactivateCustomer(
    message: string,
    authorization: string | undefined,
    intent: 'deactivate_customer',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft =
      CustomerActionExtractor.extractDeactivateCustomerDraft(message);

    if (!draft.customerQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'customers.deactivate.missingCustomer',
        ),
        data: draft,
      };
    }

    try {
      const customers = await this.solarisApiService.smartSearchCustomers(
        draft.customerQuery,
        authorization,
      );

      const matchedCustomers = this.preferExactCustomerMatches(
        customers,
        draft.customerQuery,
      );

      if (matchedCustomers.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'customers.search.notFound', {
            query: draft.customerQuery,
          }),
          data: [],
        };
      }

      if (matchedCustomers.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'customers.deactivate.multipleCustomers',
            { query: draft.customerQuery },
          ),
          data: matchedCustomers,
        };
      }

      const customer = matchedCustomers[0];

      this.confirmationState.savePendingAction({
        type: 'deactivate_customer',
        intent: 'deactivate_customer',
        data: {
          customerQuery: draft.customerQuery,
          customerId: customer.id,
          customerName: customer.razonSocial,
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'customers.deactivate.confirm', {
          name: customer.razonSocial,
          documentNumber: customer.documentNumber,
          condicionIva: customer.condicionIva,
        }),
        data: customer,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'customers.deactivate.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async confirmDeactivateCustomer(
    draft: DeactivateCustomerDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.customerId) {
      return {
        type: 'error',
        intent: 'deactivate_customer',
        message: this.novaI18n.t(
          language,
          'customers.deactivate.missingCustomer',
        ),
        data: draft,
      };
    }

    try {
      await this.solarisApiService.deactivateCustomer(
        draft.customerId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'deactivate_customer',
        message: this.novaI18n.t(language, 'customers.deactivate.deactivated', {
          name: draft.customerName ?? '-',
        }),
        data: draft,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'deactivate_customer',
        this.novaI18n.t(language, 'customers.deactivate.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  private preferExactCustomerMatches<T extends { razonSocial: string }>(
    customers: T[],
    query: string,
  ): T[] {
    const normalizedQuery = this.normalizeSearchText(query);

    const exactMatches = customers.filter(
      (customer) =>
        this.normalizeSearchText(customer.razonSocial) === normalizedQuery,
    );

    return exactMatches.length > 0 ? exactMatches : customers;
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private buildErrorResponse(
    intent:
      | 'create_customer'
      | 'search_customer'
      | 'show_customer'
      | 'update_customer'
      | 'deactivate_customer',
    message: string,
    data: unknown,
  ): ChatResponseDto {
    return {
      type: 'error',
      intent,
      message,
      data,
    };
  }
}
