export interface CreateProductDto {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId?: number;
}

export interface UpdateProductDto {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  categoryId?: number;
}

export interface ProductResponseDto {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  createdAt?: string;
  categoryId?: number;
  categoryName?: string;
  lowStockThreshold?: number;
  effectiveLowStockThreshold?: number;
  lowStock?: boolean;
  active?: boolean;
}

export interface CreateStockMovementDto {
  productId: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
}

export interface StockMovementResponseDto {
  id: number;
  productId: number;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason?: string;
  createdAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export interface UpdateSupplierDto {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export interface SupplierResponseDto {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
