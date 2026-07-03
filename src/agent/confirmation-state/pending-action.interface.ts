import {
  CreateProductDraft,
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

export type PendingActionType =
  | 'create_product'
  | 'update_product'
  | 'deactivate_product'
  | 'activate_product'
  | 'update_stock'
  | 'create_category'
  | 'create_supplier'
  | 'update_supplier'
  | 'delete_supplier'
  | 'create_supplier_order'
  | 'update_supplier_order'
  | 'complete_supplier_order'
  | 'cancel_supplier_order'
  | 'delete_supplier_order'
  | 'create_sale'
  | 'emit_invoice';

export interface PendingAction {
  type: PendingActionType;
  intent: PendingActionType;
  data:
    | CreateProductDraft
    | UpdateProductDraft
    | DeactivateProductDraft
    | ActivateProductDraft
    | UpdateStockDraft
    | CreateCategoryDraft
    | CreateSupplierDraft
    | UpdateSupplierDraft
    | DeleteSupplierDraft
    | CreateSupplierOrderDraft
    | SupplierOrderActionDraft
    | UpdateSupplierOrderDraft
    | CreateSaleDraft
    | EmitInvoiceDraft;
  createdAt: Date;
}
