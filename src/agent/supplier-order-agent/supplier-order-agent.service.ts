import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';
import { SolarisApiService } from '../../solaris-client/solaris-api/solaris-api.service';
import { ConfirmationStateService } from '../confirmation-state/confirmation-state.service';
import { NovaI18nService } from '../../i18n/nova-i18n/nova-i18n.service';
import {
  CreateSupplierOrderDraft,
  SupplierOrderActionDraft,
  SupplierOrderActionExtractor,
  UpdateSupplierOrderDraft,
} from '../extractors/supplier-order-action.extractor';

@Injectable()
export class SupplierOrderAgentService {
  constructor(
    private readonly solarisApiService: SolarisApiService,
    private readonly confirmationState: ConfirmationStateService,
    private readonly novaI18n: NovaI18nService,
  ) {}

  private buildMissingOrderIdResponse(
    intent:
      | 'show_supplier_order'
      | 'mark_supplier_order_sent'
      | 'complete_supplier_order'
      | 'cancel_supplier_order'
      | 'delete_supplier_order',
    language: string,
    draft: SupplierOrderActionDraft,
  ): ChatResponseDto {
    return {
      type: 'message',
      intent,
      message: this.novaI18n.t(
        language,
        'supplierOrders.actions.missingOrderId',
      ),
      data: draft,
    };
  }

  private buildUpdateSupplierOrderConfirmation(
    orderId: number,
    currentSupplierName: string,
    newSupplierName: string,
    draft: UpdateSupplierOrderDraft,
    language: string,
  ): string {
    const changes: string[] = [];

    if (currentSupplierName !== newSupplierName) {
      changes.push(
        this.novaI18n.t(
          language,
          'supplierOrders.update.confirmSupplierChange',
          {
            from: currentSupplierName,
            to: newSupplierName,
          },
        ),
      );
    }

    if (draft.itemsToAdd.length > 0) {
      changes.push(
        this.novaI18n.t(language, 'supplierOrders.update.confirmItemsToAdd', {
          items: draft.itemsToAdd
            .map(
              (item) =>
                `- ${item.productName ?? item.productQuery} x ${item.quantity}`,
            )
            .join('\n'),
        }),
      );
    }

    if (draft.itemsToUpdate.length > 0) {
      changes.push(
        this.novaI18n.t(
          language,
          'supplierOrders.update.confirmItemsToUpdate',
          {
            items: draft.itemsToUpdate
              .map(
                (item) =>
                  `- ${item.productName ?? item.productQuery} → ${item.quantity}`,
              )
              .join('\n'),
          },
        ),
      );
    }

    if (draft.itemsToRemove.length > 0) {
      changes.push(
        this.novaI18n.t(
          language,
          'supplierOrders.update.confirmItemsToRemove',
          {
            items: draft.itemsToRemove.map((item) => `- ${item}`).join('\n'),
          },
        ),
      );
    }

    return this.novaI18n.t(language, 'supplierOrders.update.confirmDetailed', {
      id: orderId,
      changes: changes.join('\n\n'),
    });
  }

  async handleCreateSupplierOrder(
    message: string,
    authorization: string | undefined,
    intent: 'create_supplier_order',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft =
      SupplierOrderActionExtractor.extractCreateSupplierOrderDraft(message);

    if (!draft.supplierQuery) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'supplierOrders.create.missingSupplier',
        ),
        data: draft,
      };
    }

    if (draft.items.length === 0) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'supplierOrders.create.missingItems',
        ),
        data: draft,
      };
    }

    try {
      const suppliers = await this.solarisApiService.smartSearchSuppliers(
        draft.supplierQuery,
        authorization,
      );

      if (suppliers.length === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(language, 'suppliers.search.notFound', {
            query: draft.supplierQuery,
          }),
          data: [],
        };
      }

      if (suppliers.length > 1) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'supplierOrders.create.multipleSuppliers',
            {
              query: draft.supplierQuery,
            },
          ),
          data: suppliers,
        };
      }

      const supplier = suppliers[0];

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
            'supplierOrders.create.unresolvedProducts',
          ),
          data: unresolvedItems,
        };
      }

      const completedDraft: CreateSupplierOrderDraft = {
        supplierQuery: draft.supplierQuery,
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: resolvedItems.map((item) => ({
          productQuery: item.productQuery,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
        })),
      };

      this.confirmationState.savePendingAction({
        type: 'create_supplier_order',
        intent: 'create_supplier_order',
        data: completedDraft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.create.confirm', {
          supplier: supplier.name,
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
        message: this.novaI18n.t(language, 'supplierOrders.create.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleShowSupplierOrder(
    message: string,
    authorization: string | undefined,
    intent: 'show_supplier_order',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierOrderActionExtractor.extractOrderActionDraft(message);

    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(intent, language, draft);
    }

    try {
      const order = await this.solarisApiService.getSupplierOrderById(
        draft.orderId,
        authorization,
      );

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.show.found', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.show.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleMarkSupplierOrderSent(
    message: string,
    authorization: string | undefined,
    intent: 'mark_supplier_order_sent',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierOrderActionExtractor.extractOrderActionDraft(message);

    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(intent, language, draft);
    }

    try {
      const order = await this.solarisApiService.markSupplierOrderAsSent(
        draft.orderId,
        authorization,
      );

      return {
        type: 'tool_result',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.sent.updated', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.sent.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleCompleteSupplierOrder(
    message: string,
    authorization: string | undefined,
    intent: 'complete_supplier_order',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierOrderActionExtractor.extractOrderActionDraft(message);

    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(intent, language, draft);
    }

    try {
      const order = await this.solarisApiService.getSupplierOrderById(
        draft.orderId,
        authorization,
      );

      if (order.status !== 'SENT') {
        return {
          type: 'error',
          intent,
          message: this.novaI18n.t(
            language,
            'supplierOrders.completed.invalidStatus',
          ),
          data: order,
        };
      }

      this.confirmationState.savePendingAction({
        type: 'complete_supplier_order',
        intent: 'complete_supplier_order',
        data: draft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.completed.confirm', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.completed.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleCancelSupplierOrder(
    message: string,
    authorization: string | undefined,
    intent: 'cancel_supplier_order',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierOrderActionExtractor.extractOrderActionDraft(message);

    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(intent, language, draft);
    }

    try {
      const order = await this.solarisApiService.getSupplierOrderById(
        draft.orderId,
        authorization,
      );

      if (order.status === 'COMPLETED') {
        return {
          type: 'error',
          intent,
          message: this.novaI18n.t(
            language,
            'supplierOrders.cancel.completedNotAllowed',
          ),
          data: order,
        };
      }

      this.confirmationState.savePendingAction({
        type: 'cancel_supplier_order',
        intent: 'cancel_supplier_order',
        data: draft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.cancel.confirm', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.cancel.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleDeleteSupplierOrder(
    message: string,
    authorization: string | undefined,
    intent: 'delete_supplier_order',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft = SupplierOrderActionExtractor.extractOrderActionDraft(message);

    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(intent, language, draft);
    }

    try {
      const order = await this.solarisApiService.getSupplierOrderById(
        draft.orderId,
        authorization,
      );

      if (order.status === 'COMPLETED') {
        return {
          type: 'error',
          intent,
          message: this.novaI18n.t(
            language,
            'supplierOrders.delete.completedNotAllowed',
          ),
          data: order,
        };
      }

      this.confirmationState.savePendingAction({
        type: 'delete_supplier_order',
        intent: 'delete_supplier_order',
        data: draft,
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.delete.confirm', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.delete.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async handleUpdateSupplierOrder(
    message: string,
    authorization: string | undefined,
    intent: 'update_supplier_order',
    language = 'es',
  ): Promise<ChatResponseDto> {
    const draft =
      SupplierOrderActionExtractor.extractUpdateSupplierOrderDraft(message);

    const hasAddIntent =
      /\b(add|agregar|agrega|añadir|añade|sumar|suma)\b/i.test(message);

    const hasChanges =
      Boolean(draft.supplierQuery) ||
      draft.itemsToAdd.length > 0 ||
      draft.itemsToUpdate.length > 0 ||
      draft.itemsToRemove.length > 0;

    if (hasAddIntent && draft.itemsToAdd.length === 0) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'supplierOrders.update.missingQuantity',
        ),
        data: draft,
      };
    }

    if (!hasChanges) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.update.noChanges'),
        data: draft,
      };
    }

    if (!draft.orderId) {
      return {
        type: 'message',
        intent,
        message: this.novaI18n.t(
          language,
          'supplierOrders.actions.missingOrderId',
        ),
        data: draft,
      };
    }

    try {
      const order = await this.solarisApiService.getSupplierOrderById(
        draft.orderId,
        authorization,
      );

      if (order.status !== 'DRAFT') {
        return {
          type: 'error',
          intent,
          message: this.novaI18n.t(language, 'supplierOrders.update.onlyDraft'),
          data: order,
        };
      }

      const items = [...order.items];

      let supplierId = order.supplierId;
      let supplierName = order.supplierName;

      if (draft.supplierQuery) {
        const suppliers = await this.solarisApiService.smartSearchSuppliers(
          draft.supplierQuery,
          authorization,
        );

        if (suppliers.length === 0) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(language, 'suppliers.search.notFound', {
              query: draft.supplierQuery,
            }),
            data: [],
          };
        }

        if (suppliers.length > 1) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(
              language,
              'supplierOrders.create.multipleSuppliers',
              {
                query: draft.supplierQuery,
              },
            ),
            data: suppliers,
          };
        }

        supplierId = suppliers[0].id;
        supplierName = suppliers[0].name;
      }

      for (const itemToAdd of draft.itemsToAdd) {
        const products = await this.solarisApiService.smartSearchProducts(
          itemToAdd.productQuery,
          authorization,
          true,
        );

        if (products.length !== 1) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(
              language,
              'supplierOrders.update.unresolvedProduct',
              {
                query: itemToAdd.productQuery,
              },
            ),
            data: products,
          };
        }

        const product = products[0];

        const existingItem = items.find(
          (item) => item.productId === product.id,
        );

        if (existingItem) {
          existingItem.quantity += itemToAdd.quantity;
        } else {
          items.push({
            id: 0,
            productId: product.id,
            productName: product.name,
            productBarcode: product.barcode,
            quantity: itemToAdd.quantity,
          });
        }
      }

      for (const itemToUpdate of draft.itemsToUpdate) {
        const normalizedQuery = itemToUpdate.productQuery.toLowerCase().trim();

        const existingItem = items.find((item) => {
          return (
            item.productName.toLowerCase().includes(normalizedQuery) ||
            item.productBarcode.toLowerCase().includes(normalizedQuery)
          );
        });

        if (!existingItem) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(
              language,
              'supplierOrders.update.productNotInOrder',
              {
                query: itemToUpdate.productQuery,
              },
            ),
            data: order,
          };
        }

        existingItem.quantity = itemToUpdate.quantity;
      }

      for (const productQuery of draft.itemsToRemove) {
        const normalizedQuery = productQuery.toLowerCase().trim();

        const itemIndex = items.findIndex((item) => {
          return (
            item.productName.toLowerCase().includes(normalizedQuery) ||
            item.productBarcode.toLowerCase().includes(normalizedQuery)
          );
        });

        if (itemIndex === -1) {
          return {
            type: 'message',
            intent,
            message: this.novaI18n.t(
              language,
              'supplierOrders.update.productNotInOrder',
              {
                query: productQuery,
              },
            ),
            data: order,
          };
        }

        items.splice(itemIndex, 1);
      }

      if (items.length === 0) {
        return {
          type: 'message',
          intent,
          message: this.novaI18n.t(
            language,
            'supplierOrders.update.emptyOrder',
          ),
          data: order,
        };
      }

      const completedDraft: UpdateSupplierOrderDraft = {
        ...draft,
        supplierId,
        supplierName,
        itemsToAdd: draft.itemsToAdd,
        itemsToUpdate: draft.itemsToUpdate,
        itemsToRemove: draft.itemsToRemove,
      };

      this.confirmationState.savePendingAction({
        type: 'update_supplier_order',
        intent: 'update_supplier_order',
        data: {
          ...completedDraft,
          supplierId,
          supplierName,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
        createdAt: new Date(),
      });

      return {
        type: 'confirmation',
        intent,
        message: this.buildUpdateSupplierOrderConfirmation(
          order.id,
          order.supplierName,
          supplierName,
          draft,
          language,
        ),
        data: {
          order,
          updatedItems: items,
        },
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent,
        message: this.novaI18n.t(language, 'supplierOrders.update.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmCreateSupplierOrder(
    draft: CreateSupplierOrderDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.supplierId || draft.items.length === 0) {
      return {
        type: 'error',
        intent: 'create_supplier_order',
        message: this.novaI18n.t(
          language,
          'supplierOrders.create.invalidDraft',
        ),
        data: draft,
      };
    }

    try {
      const result = await this.solarisApiService.createSupplierOrder(
        {
          supplierId: draft.supplierId,
          items: draft.items.map((item) => ({
            productId: item.productId!,
            quantity: item.quantity,
          })),
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'create_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.create.created', {
          id: result.id,
        }),
        data: result,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'create_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.create.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmCompleteSupplierOrder(
    draft: SupplierOrderActionDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(
        'complete_supplier_order',
        language,
        draft,
      );
    }

    try {
      const order = await this.solarisApiService.markSupplierOrderAsCompleted(
        draft.orderId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'complete_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.completed.updated', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'complete_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.completed.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmCancelSupplierOrder(
    draft: SupplierOrderActionDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(
        'cancel_supplier_order',
        language,
        draft,
      );
    }

    try {
      const order = await this.solarisApiService.cancelSupplierOrder(
        draft.orderId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'cancel_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.cancel.updated', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'cancel_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.cancel.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmDeleteSupplierOrder(
    draft: SupplierOrderActionDraft,
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.orderId) {
      return this.buildMissingOrderIdResponse(
        'delete_supplier_order',
        language,
        draft,
      );
    }

    try {
      await this.solarisApiService.deleteSupplierOrder(
        draft.orderId,
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'delete_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.delete.deleted', {
          id: draft.orderId,
        }),
        data: {
          id: draft.orderId,
        },
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'delete_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.delete.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async confirmUpdateSupplierOrder(
    draft: UpdateSupplierOrderDraft & {
      items?: { productId: number; quantity: number }[];
    },
    authorization?: string,
    language = 'es',
  ): Promise<ChatResponseDto> {
    if (!draft.orderId || !draft.supplierId || !draft.items?.length) {
      return {
        type: 'error',
        intent: 'update_supplier_order',
        message: this.novaI18n.t(
          language,
          'supplierOrders.update.invalidDraft',
        ),
        data: draft,
      };
    }

    try {
      const order = await this.solarisApiService.updateSupplierOrder(
        draft.orderId,
        {
          supplierId: draft.supplierId,
          items: draft.items,
        },
        authorization,
      );

      this.confirmationState.clearPendingAction();

      return {
        type: 'tool_result',
        intent: 'update_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.update.updated', {
          id: order.id,
        }),
        data: order,
      };
    } catch (error: unknown) {
      return {
        type: 'error',
        intent: 'update_supplier_order',
        message: this.novaI18n.t(language, 'supplierOrders.update.error'),
        data: {
          draft,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
