import { Injectable } from '@nestjs/common';

export type NovaIntent =
  | 'search_product'
  | 'create_product'
  | 'update_product'
  | 'deactivate_product'
  | 'activate_product'
  | 'update_stock'
  | 'list_low_stock'
  | 'get_dashboard_summary'
  | 'create_category'
  | 'create_supplier'
  | 'update_supplier'
  | 'delete_supplier'
  | 'search_supplier'
  | 'create_supplier_order'
  | 'show_supplier_order'
  | 'update_supplier_order'
  | 'mark_supplier_order_sent'
  | 'complete_supplier_order'
  | 'cancel_supplier_order'
  | 'delete_supplier_order'
  | 'unknown';

@Injectable()
export class IntentClassifierService {
  classify(message: string): NovaIntent {
    const text = this.normalize(message);

    if (this.matchesCreateCategory(text)) return 'create_category';

    if (this.matchesCreateSupplierOrder(text)) return 'create_supplier_order';
    if (this.matchesShowSupplierOrder(text)) return 'show_supplier_order';
    if (this.matchesMarkSupplierOrderSent(text))
      return 'mark_supplier_order_sent';
    if (this.matchesCompleteSupplierOrder(text))
      return 'complete_supplier_order';
    if (this.matchesCancelSupplierOrder(text)) return 'cancel_supplier_order';
    if (this.matchesDeleteSupplierOrder(text)) return 'delete_supplier_order';
    if (this.matchesUpdateSupplierOrder(text)) return 'update_supplier_order';

    if (this.matchesCreateSupplier(text)) return 'create_supplier';
    if (this.matchesSearchSupplier(text)) return 'search_supplier';
    if (this.matchesUpdateSupplier(text)) return 'update_supplier';
    if (this.matchesDeleteSupplier(text)) return 'delete_supplier';

    if (this.matchesCreateProduct(text)) return 'create_product';
    if (this.matchesDeactivateProduct(text)) return 'deactivate_product';
    if (this.matchesActivateProduct(text)) return 'activate_product';
    if (this.matchesUpdateProduct(text)) return 'update_product';
    if (this.matchesUpdateStock(text)) return 'update_stock';
    if (this.matchesLowStock(text)) return 'list_low_stock';
    if (this.matchesDashboard(text)) return 'get_dashboard_summary';
    if (this.matchesSearchProduct(text)) return 'search_product';

    return 'unknown';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private matchesCreateProduct(text: string): boolean {
    return [
      /\b(create|add|new)\s+(?:the\s+)?product\b/i,
      /\b(crear|crea|agregar|agrega|nuevo|nueva)\s+(?:el\s+|la\s+)?producto\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesUpdateProduct(text: string): boolean {
    return [
      /\b(update|edit|modify)\s+(?:the\s+)?product\b/i,
      /\b(actualizar|actualiza|editar|edita|modificar|modifica)\s+(?:el\s+|la\s+)?producto\b/i,

      /\b(change|set|update|modify)\s+(?:the\s+)?(name|price|sku|description|category)\s+(?:of\s+)?(?:the\s+)?product\b/i,
      /\b(cambiar|cambia|actualizar|actualiza|modificar|modifica|establecer|establece)\s+(?:el\s+|la\s+)?(nombre|precio|sku|descripcion|descripcion|categoria)\s+(?:del\s+|de\s+)?(?:el\s+|la\s+)?producto\b/i,

      /\b(?:the\s+)?product\s+.+\s+(?:change|set|update|modify)\s+(name|price|sku|description|category)\b/i,
      /\b(?:el\s+|la\s+)?producto\s+.+\s+(?:cambiar|cambia|actualizar|actualiza|modificar|modifica)\s+(nombre|precio|sku|descripcion|categoria)\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesDeactivateProduct(text: string): boolean {
    return [
      /\b(deactivate|disable|remove)\s+(?:the\s+)?product\b/i,
      /\b(desactivar|desactiva)\s+(?:el\s+|la\s+)?producto\b/i,
      /\bdar\s+de\s+baja\s+(?:el\s+|la\s+)?producto\b/i,
      /\b(eliminar|elimina|borrar|borra)\s+(?:el\s+|la\s+)?producto\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesActivateProduct(text: string): boolean {
    return [
      /\b(activate|reactivate|enable)\s+(?:the\s+)?product\b/i,
      /\b(activar|activa|reactivar|reactiva|habilitar|habilita)\s+(?:el\s+|la\s+)?producto\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesSearchProduct(text: string): boolean {
    return [
      /\b(search|find|show)\s+(?:the\s+)?product\b/i,
      /\b(buscar|busca|mostrar|muestra|ver)\s+(?:el\s+|la\s+)?producto\b/i,
      /\b(search|find)\b/i,
      /\b(buscar|busca)\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesUpdateStock(text: string): boolean {
    return (
      this.matchesStockIncrement(text) ||
      this.matchesStockDecrement(text) ||
      this.matchesStockAdjustment(text)
    );
  }

  private matchesStockIncrement(text: string): boolean {
    return [
      /\b(add|increase|increment)\s+stock\b/i,
      /\b(restock)\b/i,
      /\b(agregar|agrega|sumar|suma|sumale|anadir|anade|reponer)\s+stock\b/i,
      /\b(agregar|agrega|sumar|suma|anadir|anade)\s+\d+.+\s+(?:al\s+|a\s+)?(?:producto\s+)?/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesStockDecrement(text: string): boolean {
    return [
      /\b(remove|decrease|decrement|subtract)\s+stock\b/i,
      /\b(quitar|quita|restar|resta|restale|remover|remueve|descontar|descuenta)\s+stock\b/i,
      /\b(quitar|quita|restar|resta|descontar|descuenta)\s+\d+.+\s+(?:del\s+|de\s+)?(?:producto\s+)?/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesStockAdjustment(text: string): boolean {
    return [
      /\b(update|adjust|set)\s+stock\b/i,
      /\b(actualizar|actualiza|ajustar|ajusta|establecer|establece)\s+stock\b/i,
      /\bstock\s+(?:of\s+|de\s+).+\s+(?:to|a|en)\s+\d+/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesLowStock(text: string): boolean {
    return this.includesAny(text, [
      'stock bajo',
      'bajo stock',
      'productos con bajo stock',
      'low stock',
      'low-stock',
      'products with low stock',
    ]);
  }

  private matchesDashboard(text: string): boolean {
    return this.includesAny(text, [
      'dashboard',
      'panel',
      'resumen',
      'summary',
      'metrics',
      'metricas',
      'métricas',
    ]);
  }

  private matchesCreateCategory(text: string): boolean {
    return this.includesAny(text, [
      'crear categoria',
      'crear categoría',
      'agregar categoria',
      'agregar categoría',
      'nueva categoria',
      'nueva categoría',
      'create category',
      'add category',
      'new category',
    ]);
  }

  private matchesCreateSupplier(text: string): boolean {
    return this.includesAny(text, [
      'crear proveedor',
      'agregar proveedor',
      'nuevo proveedor',
      'registrar proveedor',
      'create supplier',
      'add supplier',
      'new supplier',
      'register supplier',
    ]);
  }

  private matchesUpdateSupplier(text: string): boolean {
    return this.includesAny(text, [
      'actualizar proveedor',
      'actualiza proveedor',
      'editar proveedor',
      'edita proveedor',
      'modificar proveedor',
      'modifica proveedor',
      'update supplier',
      'edit supplier',
      'modify supplier',
    ]);
  }

  private matchesDeleteSupplier(text: string): boolean {
    return this.includesAny(text, [
      'eliminar proveedor',
      'elimina proveedor',
      'borrar proveedor',
      'borra proveedor',
      'delete supplier',
      'remove supplier',
    ]);
  }

  private matchesSearchSupplier(text: string): boolean {
    return this.includesAny(text, [
      'buscar proveedor',
      'busca proveedor',
      'mostrar proveedor',
      'ver proveedor',
      'search supplier',
      'find supplier',
      'show supplier',
    ]);
  }

  private matchesCreateSupplierOrder(text: string): boolean {
    return [
      /\bcrear\s+(pedido|orden)\s+(a|para)\b/i,
      /\bcrea\s+(pedido|orden)\s+(a|para)\b/i,
      /\bgenerar\s+(pedido|orden)\s+(a|para)\b/i,
      /\bgenera\s+(pedido|orden)\s+(a|para)\b/i,
      /\bcreate\s+(supplier\s+)?order\s+(for|to|with)\b/i,
      /\bmake\s+(supplier\s+)?order\s+(for|to|with)\b/i,
      /\bcreate\s+order\s+with\s+supplier\b/i,
      /\bcreate\s+order\s+for\s+supplier\b/i,
      /\bcreate\s+order\s+to\s+supplier\b/i,
      /\bnew\s+(supplier\s+)?order\b/i,
      /\bnuevo\s+(pedido|orden)\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesShowSupplierOrder(text: string): boolean {
    return [
      /\b(show|view|see)\s+(supplier\s+)?order\s*#?\s*\d+/i,
      /\b(ver|mostrar)\s+(pedido|orden)\s*#?\s*\d+/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesUpdateSupplierOrder(text: string): boolean {
    return [
      /\b(update|edit|modify)\s+(supplier\s+)?order\s*#?\s*\d+\b/i,
      /\b(actualizar|actualiza|editar|edita|modificar|modifica)\s+(pedido|orden)\s*#?\s*\d+\b/i,
      /\b(add|change)\s+.+\s+(to|in)\s+(supplier\s+)?order\s*#?\s*\d+/i,
      /\b(agregar|agrega|anadir|anade|sumar|suma|cambiar|cambia)\s+.+\s+(al|en)\s+(pedido|orden)\s*#?\s*\d+/i,
      /\b(supplier\s+)?order\s*#?\s*\d+\s+(add|change)\b/i,
      /\b(pedido|orden)\s*#?\s*\d+\s+(agregar|agrega|anadir|anade|sumar|suma|cambiar|cambia)\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesMarkSupplierOrderSent(text: string): boolean {
    return [
      /\bmark\s+(supplier\s+)?order\s*#?\s*\d+\s+as\s+sent\b/i,
      /\b(send|sent)\s+(supplier\s+)?order\s*#?\s*\d+/i,
      /\bmarcar\s+(pedido|orden)\s*#?\s*\d+\s+como\s+enviado\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesCompleteSupplierOrder(text: string): boolean {
    return [
      /\bmark\s+(supplier\s+)?order\s*#?\s*\d+\s+as\s+complet(?:e|ed)\b/i,
      /\bcomplet(?:e|ed)\s+(supplier\s+)?order\s*#?\s*\d+/i,
      /\bcompletar\s+(pedido|orden)\s*#?\s*\d+/i,
      /\bmarcar\s+(pedido|orden)\s*#?\s*\d+\s+como\s+completado\b/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesCancelSupplierOrder(text: string): boolean {
    return [
      /\bcancel\s+(supplier\s+)?order\s*#?\s*\d+/i,
      /\b(cancelar|cancela)\s+(pedido|orden)\s*#?\s*\d+/i,
    ].some((pattern) => pattern.test(text));
  }

  private matchesDeleteSupplierOrder(text: string): boolean {
    return [
      /\b(delete|remove)\s+(supplier\s+)?order\s*#?\s*\d+/i,
      /\b(eliminar|elimina|borrar|borra)\s+(pedido|orden)\s*#?\s*\d+/i,
    ].some((pattern) => pattern.test(text));
  }

  private includesAny(text: string, patterns: string[]): boolean {
    return patterns.some((pattern) => text.includes(this.normalize(pattern)));
  }
}
