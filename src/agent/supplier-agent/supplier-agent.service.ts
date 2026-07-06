import { Injectable } from '@nestjs/common';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import {
  SupplierActionExtractor,
  CreateSupplierDraft,
  UpdateSupplierDraft,
  DeleteSupplierDraft,
} from '../extractors/supplier-action.extractor';

@Injectable()
export class SupplierAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly confirmationState: ConfirmationStateService,
    private readonly novaI18n: NovaI18nService,
  ) {}

  handleCreateSupplier(
    message: string,
    intent: 'create_supplier',
    geminiFields?: Record<string, unknown>,
    language = 'es',
  ): ChatResponseDto {
    const draftFromRegex =
      SupplierActionExtractor.extractCreateSupplierDraft(message);

    const draft: CreateSupplierDraft = {
      name:
        typeof geminiFields?.name === 'string'
          ? geminiFields.name
          : typeof geminiFields?.supplier_name === 'string'
            ? geminiFields.supplier_name
            : draftFromRegex.name,
      contactName:
        typeof geminiFields?.contactName === 'string'
          ? geminiFields.contactName
          : typeof geminiFields?.contact_name === 'string'
            ? geminiFields.contact_name
            : draftFromRegex.contactName,
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
      notes:
        typeof geminiFields?.notes === 'string'
          ? geminiFields.notes
          : draftFromRegex.notes,
    };

    if (!draft.name) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'suppliers.create.missingName'),
        data: draft,
      };
    }

    this.confirmationState.savePendingAction({
      type: 'create_supplier',
      intent: 'create_supplier',
      data: draft,
      createdAt: new Date(),
    });

    return {
      type: 'confirmation',
      intent,
      message: this.novaI18n.t(language, 'suppliers.create.confirm', {
        name: draft.name,
        contactName: draft.contactName ?? '-',
        email: draft.email ?? '-',
        phone: draft.phone ?? '-',
        address: draft.address ?? '-',
      }),
      data: draft,
    };
  }

  async confirmCreateSupplier(
    draft: CreateSupplierDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const result = await this.solarisApiService.createSupplier(
        {
          name: draft.name!,
          contactName: draft.contactName,
          email: draft.email,
          phone: draft.phone,
          address: draft.address,
          notes: draft.notes,
          active: true,
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'create_supplier',
        message: this.novaI18n.t(language, 'suppliers.create.created'),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'create_supplier',
        this.novaI18n.t(language, 'suppliers.create.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async handleSearchSupplier(
    message: string,
    authorization: string | undefined,
    intent: 'search_supplier',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const query = SupplierActionExtractor.extractSearchSupplierQuery(message);

    if (!query) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'suppliers.search.askQuery'),
      };
    }

    try {
      const suppliers = await this.solarisApiService.smartSearchSuppliers(
        query,
        authorization,
      );

      if (suppliers.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'suppliers.search.notFound', {
            query,
          }),
          data: [],
        };
      }

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'suppliers.search.found', {
          count: suppliers.length,
          query,
        }),
        data: suppliers,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'suppliers.search.error'),
        { query, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async handleUpdateSupplier(
    message: string,
    authorization: string | undefined,
    intent: 'update_supplier',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierActionExtractor.extractUpdateSupplierDraft(message);

    if (!draft.supplierQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'suppliers.update.missingSupplier'),
        data: draft,
      };
    }

    const hasUpdates =
      draft.name !== undefined ||
      draft.contactName !== undefined ||
      draft.email !== undefined ||
      draft.phone !== undefined ||
      draft.address !== undefined ||
      draft.notes !== undefined ||
      draft.active !== undefined;

    if (!hasUpdates) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'suppliers.update.missingFields'),
        data: draft,
      };
    }

    try {
      const suppliers = await this.solarisApiService.smartSearchSuppliers(
        draft.supplierQuery,
        authorization,
      );

      const matchedSuppliers = this.preferExactSupplierMatches(
        suppliers,
        draft.supplierQuery,
      );

      if (matchedSuppliers.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'suppliers.search.notFound', {
            query: draft.supplierQuery,
          }),
          data: [],
        };
      }

      if (matchedSuppliers.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'suppliers.update.multipleSuppliers',
            { query: draft.supplierQuery },
          ),
          data: matchedSuppliers,
        };
      }

      const supplier = matchedSuppliers[0];

      this.confirmationState.savePendingAction({
        type: 'update_supplier',
        intent: 'update_supplier',
        data: {
          ...draft,
          supplierId: supplier.id,
          supplierName: supplier.name,
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'suppliers.update.confirm', {
          name: draft.name ?? supplier.name,
          contactName: draft.contactName ?? supplier.contactName ?? '-',
          email: draft.email ?? supplier.email ?? '-',
          phone: draft.phone ?? supplier.phone ?? '-',
          address: draft.address ?? supplier.address ?? '-',
          notes: draft.notes ?? supplier.notes ?? '-',
        }),
        data: {
          supplier,
          draft,
        },
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'suppliers.update.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async confirmUpdateSupplier(
    draft: UpdateSupplierDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const suppliers = await this.solarisApiService.smartSearchSuppliers(
        draft.supplierName ?? draft.supplierQuery ?? '',
        authorization,
      );

      const supplier =
        suppliers.find((item) => item.id === draft.supplierId) ?? suppliers[0];

      if (!supplier) {
        return {
          type: 'error',
          intent: 'update_supplier',
          message: this.novaI18n.t(language, 'suppliers.search.notFound', {
            query: draft.supplierName ?? draft.supplierQuery ?? '',
          }),
        };
      }

      const result = await this.solarisApiService.updateSupplier(
        supplier.id,
        {
          name: draft.name ?? supplier.name,
          contactName: draft.contactName ?? supplier.contactName,
          email: draft.email ?? supplier.email,
          phone: draft.phone ?? supplier.phone,
          address: draft.address ?? supplier.address,
          notes: draft.notes ?? supplier.notes,
          active: draft.active ?? supplier.active,
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'update_supplier',
        message: this.novaI18n.t(language, 'suppliers.update.updated'),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'update_supplier',
        this.novaI18n.t(language, 'suppliers.update.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async handleDeleteSupplier(
    message: string,
    authorization: string | undefined,
    intent: 'delete_supplier',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierActionExtractor.extractDeleteSupplierDraft(message);

    if (!draft.supplierQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'suppliers.delete.missingSupplier'),
        data: draft,
      };
    }

    try {
      const suppliers = await this.solarisApiService.smartSearchSuppliers(
        draft.supplierQuery,
        authorization,
      );

      const matchedSuppliers = this.preferExactSupplierMatches(
        suppliers,
        draft.supplierQuery,
      );

      if (matchedSuppliers.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'suppliers.search.notFound', {
            query: draft.supplierQuery,
          }),
          data: [],
        };
      }

      if (matchedSuppliers.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'suppliers.delete.multipleSuppliers',
            { query: draft.supplierQuery },
          ),
          data: matchedSuppliers,
        };
      }

      const supplier = matchedSuppliers[0];

      this.confirmationState.savePendingAction({
        type: 'delete_supplier',
        intent: 'delete_supplier',
        data: {
          supplierQuery: draft.supplierQuery,
          supplierId: supplier.id,
          supplierName: supplier.name,
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'suppliers.delete.confirm', {
          name: supplier.name,
          contactName: supplier.contactName ?? '-',
          email: supplier.email ?? '-',
          phone: supplier.phone ?? '-',
          active: supplier.active ? 'Active' : 'Inactive',
        }),
        data: supplier,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'suppliers.delete.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  async confirmDeleteSupplier(
    draft: DeleteSupplierDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.supplierId) {
      return {
        type: 'error',
        intent: 'delete_supplier',
        message: this.novaI18n.t(language, 'suppliers.delete.missingSupplier'),
        data: draft,
      };
    }

    try {
      await this.solarisApiService.deleteSupplier(
        draft.supplierId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'delete_supplier',
        message: this.novaI18n.t(language, 'suppliers.delete.deleted', {
          name: draft.supplierName ?? '-',
        }),
        data: draft,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'delete_supplier',
        this.novaI18n.t(language, 'suppliers.delete.error'),
        { draft, errorMessage: this.getErrorMessage(error) },
      );
    }
  }

  private preferExactSupplierMatches<T extends { name: string }>(
    suppliers: T[],
    query: string,
  ): T[] {
    const normalizedQuery = this.normalizeSearchText(query);

    const exactMatches = suppliers.filter(
      (supplier) => this.normalizeSearchText(supplier.name) === normalizedQuery,
    );

    return exactMatches.length > 0 ? exactMatches : suppliers;
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
      | 'create_supplier'
      | 'search_supplier'
      | 'update_supplier'
      | 'delete_supplier',
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
