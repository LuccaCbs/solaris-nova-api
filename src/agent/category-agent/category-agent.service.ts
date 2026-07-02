import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import {
  ProductActionExtractor,
  CreateCategoryDraft,
} from '../extractors/product-action.extractor';

@Injectable()
export class CategoryAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly confirmationState: ConfirmationStateService,
    private readonly novaI18n: NovaI18nService,
  ) {}

  async confirmCreateCategory(
    draft: CreateCategoryDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const result = await this.solarisApiService.createCategory(
        {
          name: draft.name!,
          description: draft.description ?? '',
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'create_category',
        message: this.novaI18n.t(language, 'categories.create.created'),
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      return {
        type: 'error',
        intent: 'create_category',
        message: this.novaI18n.t(language, 'categories.create.error'),
        data: {
          draft,
          errorMessage,
        },
      };
    }
  }

  handleCreateCategory(
    message: string,
    intent: 'create_category',
    geminiFields?: Record<string, unknown>,
    language = 'es',
  ): ChatResponseDto {
    const draftFromRegex =
      ProductActionExtractor.extractCreateCategoryDraft(message);

    const draft = {
      name:
        typeof geminiFields?.name === 'string'
          ? geminiFields.name
          : typeof geminiFields?.category_name === 'string'
            ? geminiFields.category_name
            : typeof geminiFields?.category === 'string'
              ? geminiFields.category
              : draftFromRegex.name,

      description:
        typeof geminiFields?.description === 'string'
          ? geminiFields.description
          : draftFromRegex.description,
    };
    if (!draft.name) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'categories.create.missingName'),
        data: draft,
      };
    }

    this.confirmationState.savePendingAction({
      type: 'create_category',
      intent: 'create_category',
      data: draft,
      createdAt: new Date(),
    });

    return {
      type: 'confirmation',
      intent,
      message: this.novaI18n.t(language, 'categories.create.confirm', {
        name: draft.name,
      }),
      data: draft,
    };
  }
}
