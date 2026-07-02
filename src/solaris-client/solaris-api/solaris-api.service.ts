import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  CreateStockMovementDto,
  StockMovementResponseDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierResponseDto,
} from '../dto/create-product.dto';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import Fuse from 'fuse.js';

export interface DashboardResponseDto {
  todaySalesCount: number;
  todaySalesAmount: number;
  lowStockProductsCount: number;
  supplierOrders: {
    sent: number;
    completed: number;
    cancelled: number;
  };
  monthlySales: {
    date: string;
    salesCount: number;
    totalAmount: number;
  }[];
}

export interface CategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  systemCategory?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface SupplierOrderItemRequestDto {
  productId: number;
  quantity: number;
}

export interface CreateSupplierOrderRequestDto {
  supplierId: number;
  items: SupplierOrderItemRequestDto[];
}

export type UpdateSupplierOrderRequestDto = CreateSupplierOrderRequestDto;

export interface SupplierOrderItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
}

export type SupplierOrderStatusDto =
  | 'DRAFT'
  | 'SENT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SupplierOrderResponseDto {
  id: number;
  supplierId: number;
  supplierName: string;
  supplierPhone?: string;
  status: SupplierOrderStatusDto;
  messagePreview: string;
  items: SupplierOrderItemResponseDto[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SolarisApiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /*PRODUCTS-START*/

  async suggestProducts(
    search: string,
    authorization?: string,
  ): Promise<ProductResponseDto[]> {
    const allProducts = await this.searchProducts('', authorization);

    const searchableProducts = allProducts.map((product) => ({
      ...product,
      normalizedSearchText: this.normalizeSearchText(
        [product.name, product.sku, product.description, product.categoryName]
          .filter(Boolean)
          .join(' '),
      ),
    }));

    const fuse = new Fuse(searchableProducts, {
      keys: ['normalizedSearchText'],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    return fuse
      .search(this.normalizeSearchText(search))
      .slice(0, 5)
      .map((result) => result.item);
  }

  async createProduct(
    input: CreateProductDto,
    authorization?: string,
  ): Promise<ProductResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<AxiosResponse<ProductResponseDto>>(
        this.httpService.post<ProductResponseDto>(
          `${solarisApiUrl}/api/v1/products`,
          input,
          {
            headers: authorization
              ? {
                  Authorization: authorization,
                }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      throw new BadGatewayException({
        message: 'Error al llamar a Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisMessage: axiosError.response?.data?.message,
        solarisError: axiosError.response?.data?.error,
        requestUrl: `${solarisApiUrl}/api/v1/products`,
        requestPayload: input,
      });
    }
  }

  async deactivateProduct(
    productId: number,
    authorization?: string,
  ): Promise<ProductResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.patch<ProductResponseDto>(
        `${solarisApiUrl}/api/v1/products/${productId}/deactivate`,
        {},
        {
          headers: authorization
            ? {
                Authorization: authorization,
              }
            : undefined,
        },
      ),
    );

    return response.data;
  }

  async activateProduct(
    productId: number,
    authorization?: string,
  ): Promise<ProductResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.patch<ProductResponseDto>(
        `${solarisApiUrl}/api/v1/products/${productId}/activate`,
        {},
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async searchProducts(
    search: string,
    authorization?: string,
    active?: boolean,
  ): Promise<ProductResponseDto[]> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<AxiosResponse<ProductResponseDto[]>>(
        this.httpService.get<ProductResponseDto[]>(
          `${solarisApiUrl}/api/v1/products`,
          {
            params: {
              search,
              ...(active !== undefined ? { active } : {}),
            },
            headers: authorization
              ? {
                  Authorization: authorization,
                }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;

      throw new BadGatewayException({
        message: 'Error al buscar productos en Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisResponse: axiosError.response?.data,
        requestUrl: `${solarisApiUrl}/api/v1/products`,
        requestParams: { search, active },
      });
    }
  }

  async smartSearchProducts(
    query: string,
    authorization?: string,
    active?: boolean,
  ): Promise<ProductResponseDto[]> {
    const directResults = await this.searchProducts(
      query,
      authorization,
      active,
    );

    if (directResults.length > 0) {
      return directResults;
    }

    const tokens = this.normalizeSearchText(query).split(/\s+/);

    if (tokens.length === 0) {
      return [];
    }

    const allProducts = await this.searchProducts('', authorization, active);

    return allProducts.filter((product) => {
      const searchableText = this.normalizeSearchText(
        [product.name, product.sku, product.description, product.categoryName]
          .filter(Boolean)
          .join(' '),
      );

      return tokens.every((token) => searchableText.includes(token));
    });
  }

  async getProductById(
    id: number | string,
    authorization?: string,
  ): Promise<ProductResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<AxiosResponse<ProductResponseDto>>(
        this.httpService.get<ProductResponseDto>(
          `${solarisApiUrl}/api/v1/products/${id}`,
          {
            headers: authorization
              ? { Authorization: authorization }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;

      throw new BadGatewayException({
        message: 'Error al obtener producto en Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisResponse: axiosError.response?.data,
        requestUrl: `${solarisApiUrl}/api/v1/products/${id}`,
      });
    }
  }

  async createStockMovement(
    input: CreateStockMovementDto,
    authorization?: string,
  ): Promise<StockMovementResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.post<StockMovementResponseDto>(
        `${solarisApiUrl}/api/v1/stock-movements`,
        input,
        {
          headers: authorization
            ? {
                Authorization: authorization,
              }
            : undefined,
        },
      ),
    );

    return response.data;
  }

  async updateProduct(
    id: number | string,
    input: UpdateProductDto,
    authorization?: string,
  ): Promise<ProductResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<AxiosResponse<ProductResponseDto>>(
        this.httpService.put<ProductResponseDto>(
          `${solarisApiUrl}/api/v1/products/${id}`,
          input,
          {
            headers: authorization
              ? { Authorization: authorization }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;

      throw new BadGatewayException({
        message: 'Error al actualizar producto en Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisResponse: axiosError.response?.data,
        requestUrl: `${solarisApiUrl}/api/v1/products/${id}`,
        requestPayload: input,
      });
    }
  }

  /*PRODUCTS-END*/

  /*CATEGORIES-START*/

  async getCategories(authorization?: string): Promise<CategoryResponseDto[]> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<
        AxiosResponse<CategoryResponseDto[]>
      >(
        this.httpService.get<CategoryResponseDto[]>(
          `${solarisApiUrl}/api/v1/categories`,
          {
            headers: authorization
              ? { Authorization: authorization }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;

      throw new BadGatewayException({
        message: 'Error al consultar categorías en Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisResponse: axiosError.response?.data,
        requestUrl: `${solarisApiUrl}/api/v1/categories`,
      });
    }
  }

  async searchCategoriesByName(
    name: string,
    authorization?: string,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.getCategories(authorization);
    const normalizedName = name.trim().toLowerCase();

    return categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedName),
    );
  }

  async createCategory(
    input: CreateCategoryDto,
    authorization?: string,
  ): Promise<CategoryResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<AxiosResponse<CategoryResponseDto>>(
        this.httpService.post<CategoryResponseDto>(
          `${solarisApiUrl}/api/v1/categories`,
          input,
          {
            headers: authorization
              ? { Authorization: authorization }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;

      throw new BadGatewayException({
        message: 'Error al crear categoría en Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisResponse: axiosError.response?.data,
        requestUrl: `${solarisApiUrl}/api/v1/categories`,
        requestPayload: input,
      });
    }
  }

  /*CATEGORIES-END*/

  /*SUPPLIERS-START*/

  async createSupplier(
    input: CreateSupplierDto,
    authorization?: string,
  ): Promise<SupplierResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.post<SupplierResponseDto>(
        `${solarisApiUrl}/api/v1/suppliers`,
        input,
        {
          headers: authorization
            ? {
                Authorization: authorization,
              }
            : undefined,
        },
      ),
    );

    return response.data;
  }

  async updateSupplier(
    supplierId: number,
    input: UpdateSupplierDto,
    authorization?: string,
  ): Promise<SupplierResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.put<SupplierResponseDto>(
        `${solarisApiUrl}/api/v1/suppliers/${supplierId}`,
        input,
        {
          headers: authorization
            ? {
                Authorization: authorization,
              }
            : undefined,
        },
      ),
    );

    return response.data;
  }

  async deleteSupplier(
    supplierId: number,
    authorization?: string,
  ): Promise<void> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    await firstValueFrom(
      this.httpService.delete(
        `${solarisApiUrl}/api/v1/suppliers/${supplierId}`,
        {
          headers: authorization
            ? {
                Authorization: authorization,
              }
            : undefined,
        },
      ),
    );
  }

  async getSuppliers(authorization?: string): Promise<SupplierResponseDto[]> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.get<SupplierResponseDto[]>(
        `${solarisApiUrl}/api/v1/suppliers`,
        {
          headers: authorization
            ? {
                Authorization: authorization,
              }
            : undefined,
        },
      ),
    );

    return response.data;
  }

  async smartSearchSuppliers(
    query: string,
    authorization?: string,
  ): Promise<SupplierResponseDto[]> {
    const suppliers = await this.getSuppliers(authorization);

    const normalizedQuery = this.normalizeSearchText(query);

    if (!normalizedQuery) {
      return suppliers;
    }

    return suppliers.filter((supplier) => {
      const searchableText = this.normalizeSearchText(
        [
          supplier.name,
          supplier.contactName,
          supplier.email,
          supplier.phone,
          supplier.address,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return searchableText.includes(normalizedQuery);
    });
  }

  /*SUPPLIERS-END*/

  /*SUPPLIER-ORDERS-START*/

  async createSupplierOrder(
    request: CreateSupplierOrderRequestDto,
    authorization?: string,
  ): Promise<SupplierOrderResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.post<SupplierOrderResponseDto>(
        `${solarisApiUrl}/api/v1/supplier-orders`,
        request,
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async getSupplierOrders(
    authorization?: string,
  ): Promise<SupplierOrderResponseDto[]> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.get<SupplierOrderResponseDto[]>(
        `${solarisApiUrl}/api/v1/supplier-orders`,
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async getSupplierOrderById(
    id: number,
    authorization?: string,
  ): Promise<SupplierOrderResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.get<SupplierOrderResponseDto>(
        `${solarisApiUrl}/api/v1/supplier-orders/${id}`,
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async updateSupplierOrder(
    id: number,
    request: UpdateSupplierOrderRequestDto,
    authorization?: string,
  ): Promise<SupplierOrderResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.put<SupplierOrderResponseDto>(
        `${solarisApiUrl}/api/v1/supplier-orders/${id}`,
        request,
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async markSupplierOrderAsSent(
    id: number,
    authorization?: string,
  ): Promise<SupplierOrderResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.patch<SupplierOrderResponseDto>(
        `${solarisApiUrl}/api/v1/supplier-orders/${id}/sent`,
        {},
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async markSupplierOrderAsCompleted(
    id: number,
    authorization?: string,
  ): Promise<SupplierOrderResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.patch<SupplierOrderResponseDto>(
        `${solarisApiUrl}/api/v1/supplier-orders/${id}/completed`,
        {},
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async cancelSupplierOrder(
    id: number,
    authorization?: string,
  ): Promise<SupplierOrderResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    const response = await firstValueFrom(
      this.httpService.patch<SupplierOrderResponseDto>(
        `${solarisApiUrl}/api/v1/supplier-orders/${id}/cancel`,
        {},
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );

    return response.data;
  }

  async deleteSupplierOrder(id: number, authorization?: string): Promise<void> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    await firstValueFrom(
      this.httpService.delete<void>(
        `${solarisApiUrl}/api/v1/supplier-orders/${id}`,
        {
          headers: authorization ? { Authorization: authorization } : undefined,
        },
      ),
    );
  }

  /*SUPPLIER-ORDERS-END*/

  async getLowStockProducts(
    authorization?: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.searchProducts('', authorization);

    return products.filter((product) => product.lowStock === true);
  }

  async getDashboardSummary(
    authorization?: string,
  ): Promise<DashboardResponseDto> {
    const solarisApiUrl = this.configService.get<string>('SOLARIS_API_URL');

    try {
      const response = await lastValueFrom<AxiosResponse<DashboardResponseDto>>(
        this.httpService.get<DashboardResponseDto>(
          `${solarisApiUrl}/api/v1/dashboard`,
          {
            headers: authorization
              ? { Authorization: authorization }
              : undefined,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;

      throw new BadGatewayException({
        message: 'Error al consultar dashboard en Solaris API.',
        solarisStatus: axiosError.response?.status,
        solarisResponse: axiosError.response?.data,
        requestUrl: `${solarisApiUrl}/api/v1/dashboard`,
      });
    }
  }
}
