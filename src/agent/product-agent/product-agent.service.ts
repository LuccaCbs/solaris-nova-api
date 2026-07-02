import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import { CategoryResolverService } from '../category-resolver/category-resolver.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import { PendingAction } from '../confirmation-state/pending-action.interface';
import { ProductResponseDto } from '../../solaris-client/dto/create-product.dto';
import {
  ProductActionExtractor,
  UpdateStockDraft,
  UpdateProductDraft,
  DeactivateProductDraft,
  ActivateProductDraft,
} from '../extractors/product-action.extractor';

@Injectable()
export class ProductAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly confirmationState: ConfirmationStateService,
    private readonly categoryResolverService: CategoryResolverService,
    private readonly novaI18n: NovaI18nService,
  ) {}

  async confirmCreateProduct(
    pendingAction: PendingAction,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (pendingAction.intent !== 'create_product') {
      return {
        type: 'error',
        intent: pendingAction.intent,
        message: this.novaI18n.t(language, 'products.create.pendingMismatch'),
      };
    }

    const draft = pendingAction.data;

    if (!('name' in draft) || !('price' in draft) || !('stock' in draft)) {
      return {
        type: 'error',
        intent: pendingAction.intent,
        message: this.novaI18n.t(language, 'products.create.invalidDraft'),
        data: draft,
      };
    }

    let categoryId: number | undefined = undefined;

    if ('categoryName' in draft && draft.categoryName) {
      const resolvedCategoryName =
        this.categoryResolverService.resolveCategoryName(draft.categoryName);

      const categories = await this.solarisApiService.searchCategoriesByName(
        resolvedCategoryName,
        authorization,
      );

      if (categories.length === 1) {
        categoryId = categories[0].id;
      }

      if (categories.length > 1) {
        return {
          type: 'message',
          intent: pendingAction.intent,
          message: this.novaI18n.t(
            language,
            'products.create.multipleCategories',
            {
              category: draft.categoryName,
            },
          ),
          data: categories,
        };
      }

      if (categories.length === 0) {
        this.confirmationState.savePendingAction({
          type: 'create_product',
          intent: 'create_product',
          data: {
            ...draft,
            categoryName: undefined,
          },
          createdAt: new Date(),
        });

        return {
          type: 'confirmation',
          intent: pendingAction.intent,
          message: this.novaI18n.t(
            language,
            'products.create.categoryFallbackConfirm',
            {
              category: draft.categoryName,
            },
          ),
          data: {
            ...draft,
            categoryName: undefined,
          },
        };
      }
    }

    try {
      const result = await this.solarisApiService.createProduct(
        {
          name: draft.name!,
          description: this.novaI18n.t(
            language,
            'products.create.defaultDescription',
          ),
          sku: '',
          price: draft.price!,
          stockQuantity: draft.stock!,
          lowStockThreshold: 10,
          categoryId,
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: pendingAction.intent,
        message: this.novaI18n.t(language, 'products.create.created'),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        pendingAction.intent,
        this.novaI18n.t(language, 'products.create.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async confirmUpdateProduct(
    draft: UpdateProductDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const products = await this.solarisApiService.smartSearchProducts(
        draft.productName ?? draft.productQuery ?? '',
        authorization,
      );

      const product =
        products.find((item) => item.id === draft.productId) ?? products[0];

      if (!product) {
        return {
          type: 'error',
          intent: 'update_product',
          message: this.novaI18n.t(language, 'products.search.notFound', {
            query: draft.productName ?? draft.productQuery ?? '',
          }),
        };
      }

      const result = await this.solarisApiService.updateProduct(
        product.id,
        {
          name: draft.name ?? product.name,
          description: draft.description ?? product.description,
          sku: draft.sku ?? product.sku,
          price: draft.price ?? product.price,
          stock: product.stockQuantity,
          lowStockThreshold: product.lowStockThreshold,
          categoryId: product.categoryId,
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'update_product',
        message: this.novaI18n.t(language, 'products.update.updated'),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'update_product',
        this.novaI18n.t(language, 'products.update.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async confirmDeactivateProduct(
    draft: DeactivateProductDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.productId) {
      return {
        type: 'error',
        intent: 'deactivate_product',
        message: this.novaI18n.t(
          language,
          'products.deactivate.missingProduct',
        ),
        data: draft,
      };
    }

    try {
      const result = await this.solarisApiService.deactivateProduct(
        draft.productId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'deactivate_product',
        message: this.novaI18n.t(language, 'products.deactivate.deactivated', {
          name: draft.productName ?? result.name,
        }),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'deactivate_product',
        this.novaI18n.t(language, 'products.deactivate.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async confirmActivateProduct(
    draft: ActivateProductDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.productId) {
      return {
        type: 'error',
        intent: 'activate_product',
        message: this.novaI18n.t(language, 'products.activate.missingProduct'),
        data: draft,
      };
    }

    try {
      const result = await this.solarisApiService.activateProduct(
        draft.productId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'activate_product',
        message: this.novaI18n.t(language, 'products.activate.activated', {
          name: draft.productName ?? result.name,
        }),
        data: result,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        'activate_product',
        this.novaI18n.t(language, 'products.activate.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async confirmUpdateStock(
    draft: UpdateStockDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    let product: ProductResponseDto | undefined;

    try {
      product = await this.solarisApiService.getProductById(
        draft.productId!,
        authorization,
      );

      const requestedQuantity = draft.quantity ?? 0;

      const movementQuantity =
        draft.mode === 'set'
          ? requestedQuantity - product.stockQuantity
          : requestedQuantity;

      const newStockQuantity =
        draft.mode === 'increment'
          ? product.stockQuantity + requestedQuantity
          : draft.mode === 'decrement'
            ? product.stockQuantity - requestedQuantity
            : requestedQuantity;

      if (newStockQuantity < 0) {
        return {
          type: 'error',
          intent: 'update_stock',
          message: this.novaI18n.t(language, 'stock.negativeResult'),
          data: { product, draft },
        };
      }

      if (movementQuantity === 0) {
        this.confirmationState.clearPendingAction();

        return {
          type: 'message',
          intent: 'update_stock',
          message: this.novaI18n.t(language, 'stock.noChange'),
          data: { product, draft },
        };
      }

      const movement = await this.solarisApiService.createStockMovement(
        {
          productId: product.id,
          type: movementQuantity < 0 ? 'OUT' : 'IN',
          quantity: Math.abs(movementQuantity),
          reason: this.novaI18n.t(language, 'stock.defaultReason'),
        },
        authorization,
      );

      const result = await this.solarisApiService.getProductById(
        product.id,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'update_stock',
        message: this.novaI18n.t(language, 'stock.updated', {
          stock: movement.currentStock,
        }),
        data: result,
      };
    } catch (error: unknown) {
      console.error('Nova stock update error:', error);

      return this.buildErrorResponse(
        'update_stock',
        this.novaI18n.t(language, 'stock.updateError'),
        {
          product,
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  handleCreateProduct(
    message: string,
    authorization: string | undefined,
    intent: 'create_product',
    geminiFields?: Record<string, unknown>,
    language = 'es',
  ): ChatResponseDto {
    void authorization;

    const draftFromRegex =
      ProductActionExtractor.extractCreateProductDraft(message);

    const draft = {
      name:
        typeof geminiFields?.name === 'string'
          ? geminiFields.name
          : typeof geminiFields?.product_name === 'string'
            ? geminiFields.product_name
            : draftFromRegex.name,

      price:
        typeof geminiFields?.price === 'number'
          ? geminiFields.price
          : draftFromRegex.price,

      stock:
        typeof geminiFields?.stock === 'number'
          ? geminiFields.stock
          : draftFromRegex.stock,

      categoryName:
        typeof geminiFields?.category === 'string'
          ? geminiFields.category
          : typeof geminiFields?.categoryName === 'string'
            ? geminiFields.categoryName
            : draftFromRegex.categoryName,
    };

    const missingFields: string[] = [];

    if (!draft.name) {
      missingFields.push(this.novaI18n.t(language, 'fields.name'));
    }

    if (draft.price === undefined) {
      missingFields.push(this.novaI18n.t(language, 'fields.price'));
    }

    if (draft.stock === undefined) {
      missingFields.push(this.novaI18n.t(language, 'fields.initialStock'));
    }

    if (missingFields.length > 0) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'products.create.missingFields', {
          fields: missingFields.join(', '),
        }),
        data: draft,
      };
    }

    this.confirmationState.savePendingAction({
      type: 'create_product',
      intent: 'create_product',
      data: draft,
      createdAt: new Date(),
    });

    return {
      type: 'confirmation',
      intent,
      message: this.novaI18n.t(language, 'products.create.confirm', {
        name: draft.name ?? '',
        price: draft.price ?? 0,
        stock: draft.stock ?? 0,
        category: draft.categoryName ?? 'GENERAL',
      }),
      data: draft,
    };
  }

  async handleUpdateProduct(
    message: string,
    authorization: string | undefined,
    intent: 'update_product',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = ProductActionExtractor.extractUpdateProductDraft(message);

    if (!draft.productQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'products.update.missingProduct'),
        data: draft,
      };
    }

    const hasUpdates =
      draft.name !== undefined ||
      draft.description !== undefined ||
      draft.sku !== undefined ||
      draft.price !== undefined ||
      draft.categoryName !== undefined;

    if (!hasUpdates) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'products.update.missingFields'),
        data: draft,
      };
    }

    try {
      const products = await this.solarisApiService.smartSearchProducts(
        draft.productQuery,
        authorization,
      );

      const matchedProducts = this.preferExactProductMatches(
        products,
        draft.productQuery,
      );

      if (matchedProducts.length === 0) {
        return {
          type: 'message',
          intent: 'update_product',
          message: this.novaI18n.t(language, 'products.search.notFound', {
            query: draft.productQuery,
          }),
          data: draft,
        };
      }

      if (matchedProducts.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'products.update.multipleProducts',
            {
              query: draft.productQuery,
            },
          ),
          data: matchedProducts,
        };
      }

      const product = matchedProducts[0];

      this.confirmationState.savePendingAction({
        type: 'update_product',
        intent: 'update_product',
        data: {
          ...draft,
          productId: product.id,
          productName: product.name,
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'products.update.confirm', {
          name: product.name,
          newName: draft.name ?? product.name,
          sku: draft.sku ?? product.sku ?? '-',
          price: draft.price ?? product.price,
          description: draft.description ?? product.description ?? '-',
          category: draft.categoryName ?? product.categoryName ?? '-',
        }),
        data: {
          product,
          draft,
        },
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'products.update.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async handleDeactivateProduct(
    message: string,
    authorization: string | undefined,
    intent: 'deactivate_product',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = ProductActionExtractor.extractDeactivateProductDraft(message);

    if (!draft.productQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'products.deactivate.missingProduct',
        ),
        data: draft,
      };
    }

    try {
      const products = await this.solarisApiService.smartSearchProducts(
        draft.productQuery,
        authorization,
        true,
      );

      const matchedProducts = this.preferExactProductMatches(
        products,
        draft.productQuery,
      );

      if (matchedProducts.length === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'products.search.notFound', {
            query: draft.productQuery,
          }),
          data: [],
        };
      }

      if (matchedProducts.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'products.deactivate.multipleProducts',
            {
              query: draft.productQuery,
            },
          ),
          data: matchedProducts,
        };
      }

      const product = matchedProducts[0];

      this.confirmationState.savePendingAction({
        type: 'deactivate_product',
        intent: 'deactivate_product',
        data: {
          productQuery: draft.productQuery,
          productId: product.id,
          productName: product.name,
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'products.deactivate.confirm', {
          name: product.name,
          sku: product.sku ?? '-',
          stock: product.stockQuantity,
          category: product.categoryName ?? '-',
        }),
        data: product,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'products.deactivate.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async handleActivateProduct(
    message: string,
    authorization: string | undefined,
    intent: 'activate_product',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = ProductActionExtractor.extractActivateProductDraft(message);

    if (!draft.productQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'products.activate.missingProduct'),
        data: draft,
      };
    }

    try {
      const products = await this.solarisApiService.smartSearchProducts(
        draft.productQuery,
        authorization,
        false,
      );

      const matchedProducts = this.preferExactProductMatches(
        products,
        draft.productQuery,
      );

      if (matchedProducts.length === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'products.search.notFound', {
            query: draft.productQuery,
          }),
          data: [],
        };
      }

      if (matchedProducts.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'products.activate.multipleProducts',
            {
              query: draft.productQuery,
            },
          ),
          data: matchedProducts,
        };
      }

      const product = matchedProducts[0];

      this.confirmationState.savePendingAction({
        type: 'activate_product',
        intent: 'activate_product',
        data: {
          productQuery: draft.productQuery,
          productId: product.id,
          productName: product.name,
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'products.activate.confirm', {
          name: product.name,
          sku: product.sku ?? '-',
          stock: product.stockQuantity,
          category: product.categoryName ?? '-',
        }),
        data: product,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'products.activate.error'),
        {
          draft,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async handleSearchProduct(
    message: string,
    authorization: string | undefined,
    intent: 'search_product',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const query = ProductActionExtractor.extractSearchProductQuery(message);

    if (!query) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'products.search.askQuery'),
      };
    }

    try {
      const products = await this.solarisApiService.smartSearchProducts(
        query,
        authorization,
      );

      if (products.length === 0) {
        const suggestions = await this.solarisApiService.suggestProducts(
          query,
          authorization,
        );

        if (suggestions.length > 0) {
          return {
            type: 'tool_result',
            intent,
            message: this.novaI18n.t(
              language,
              'products.search.exactNotFoundWithSuggestions',
              { query },
            ),
            data: suggestions,
          };
        }

        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'products.search.notFound', {
            query,
          }),
          data: [],
        };
      }

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'products.search.found', {
          count: products.length,
          query,
        }),
        data: products,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'products.search.error'),
        {
          query,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  async handleUpdateStock(
    message: string,
    authorization: string | undefined,
    intent: 'update_stock',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = ProductActionExtractor.extractUpdateStockDraft(message);

    const missingFields: string[] = [];

    if (!draft.productQuery) {
      missingFields.push(this.novaI18n.t(language, 'fields.product'));
    }

    if (draft.quantity === undefined) {
      missingFields.push(this.novaI18n.t(language, 'fields.quantity'));
    }

    if (missingFields.length > 0) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'stock.missingFields', {
          fields: missingFields.join(', '),
        }),
        data: draft,
      };
    }

    const productQuery = draft.productQuery!;
    const quantity = draft.quantity!;

    let products: ProductResponseDto[] = [];

    try {
      products = await this.solarisApiService.smartSearchProducts(
        productQuery,
        authorization,
      );
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'stock.searchError'),
        {
          productQuery,
          errorMessage: this.getErrorMessage(error),
        },
      );
    }

    const matchedProducts = this.preferExactProductMatches(
      products,
      productQuery,
    );

    if (matchedProducts.length === 0) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'products.search.notFound', {
          query: productQuery,
        }),
        data: [],
      };
    }

    if (matchedProducts.length > 1) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'stock.multipleProducts', {
          query: productQuery,
        }),
        data: matchedProducts,
      };
    }

    const product = matchedProducts[0];

    const newStockQuantity =
      draft.mode === 'increment'
        ? product.stockQuantity + quantity
        : draft.mode === 'decrement'
          ? product.stockQuantity - quantity
          : quantity;

    if (newStockQuantity < 0) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'stock.negativeResult'),
        data: {
          product,
          draft,
          newStockQuantity,
        },
      };
    }

    this.confirmationState.savePendingAction({
      type: 'update_stock',
      intent: 'update_stock',
      data: {
        ...draft,
        productId: product.id,
      },
      createdAt: new Date(),
    });

    return {
      type: 'confirmation',
      intent,
      message: this.novaI18n.t(language, 'stock.confirm', {
        product: product.name,
        currentStock: product.stockQuantity,
        newStock: newStockQuantity,
      }),
      data: {
        product,
        draft,
        newStockQuantity,
      },
    };
  }

  async handleListLowStockProducts(
    authorization: string | undefined,
    intent: 'list_low_stock',
    language = 'es',
  ): Promise<ChatResponseDto> {
    try {
      const products =
        await this.solarisApiService.getLowStockProducts(authorization);

      if (products.length === 0) {
        return {
          type: 'tool_result',
          intent,
          message: this.novaI18n.t(language, 'lowStock.empty'),
          data: [],
        };
      }

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'lowStock.found', {
          count: products.length,
        }),
        data: products,
      };
    } catch (error: unknown) {
      return this.buildErrorResponse(
        intent,
        this.novaI18n.t(language, 'lowStock.error'),
        {
          errorMessage: this.getErrorMessage(error),
        },
      );
    }
  }

  private preferExactProductMatches<T extends { name: string; sku?: string }>(
    products: T[],
    query: string,
  ): T[] {
    const normalizedQuery = this.normalizeSearchText(query);

    const exactMatches = products.filter((product) => {
      return (
        this.normalizeSearchText(product.name) === normalizedQuery ||
        this.normalizeSearchText(product.sku ?? '') === normalizedQuery
      );
    });

    return exactMatches.length > 0 ? exactMatches : products;
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
    intent: string,
    message: string,
    data?: unknown,
  ): ChatResponseDto {
    return {
      type: 'error',
      intent,
      message,
      data,
    };
  }
}
