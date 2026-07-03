export const es = {
  fields: {
    name: 'nombre',
    price: 'precio',
    initialStock: 'stock inicial',
    product: 'producto',
    quantity: 'cantidad',
  },
  conversation: {
    restarted: 'Conversación reiniciada.',
    cancelled: 'Operación cancelada. No realicé ningún cambio.',
    unknownIntent:
      'No pude identificar con seguridad qué acción querés realizar. ¿Podés reformularlo?',
  },
  products: {
    search: {
      askQuery: '¿Qué producto querés buscar?',
      notFound: 'No encontré productos que coincidan con "{{query}}".',
      exactNotFoundWithSuggestions:
        'No encontré productos exactos para "{{query}}". Quizás buscabas alguno de estos:',
      found: 'Encontré {{count}} producto(s) para "{{query}}".',
      error: 'No pude buscar productos en Solaris.',
    },
    create: {
      pendingMismatch:
        'La acción pendiente no corresponde a creación de producto.',
      invalidDraft: 'El borrador de producto no tiene el formato esperado.',
      missingFields:
        'Para crear el producto necesito que indiques: {{fields}}.',
      confirm:
        'Entendí que querés crear el siguiente producto:\n\nNombre: {{name}}\nPrecio: ${{price}}\nStock inicial: {{stock}}\nCategoría: {{category}}\n\n¿Confirmás que lo cree?',
      multipleCategories:
        'Encontré varias categorías para "{{category}}". Necesito que seas más específico.',
      categoryFallbackConfirm:
        'No encontré la categoría "{{category}}".\n\nPuedo crear el producto en la categoría GENERAL.\n\n¿Confirmás que lo cree en GENERAL?',
      defaultDescription: 'Producto creado por Nova Copilot',
      created: 'Producto creado correctamente en Solaris.',
      error: 'No pude crear el producto en Solaris.',
    },
    update: {
      missingProduct:
        'Para actualizar un producto necesito que indiques cuál producto.',
      missingFields:
        'Para actualizar un producto necesito que indiques qué dato querés cambiar.',
      multipleProducts:
        'Encontré varios productos para "{{query}}". Necesito que seas más específico.',
      confirm:
        'Entendí que querés actualizar el siguiente producto:\n\nProducto actual: {{name}}\nNuevo nombre: {{newName}}\nSKU: {{sku}}\nPrecio: ${{price}}\nDescripción: {{description}}\nCategoría: {{category}}\n\n¿Confirmás la operación?',
      updated: 'Producto actualizado correctamente en Solaris.',
      error: 'No pude actualizar el producto en Solaris.',
    },
    deactivate: {
      missingProduct:
        'Para dar de baja un producto necesito que indiques cuál producto.',
      multipleProducts:
        'Encontré varios productos para "{{query}}". Necesito que seas más específico.',
      confirm:
        'Entendí que querés dar de baja el siguiente producto:\n\nNombre: {{name}}\nSKU: {{sku}}\nStock actual: {{stock}}\nCategoría: {{category}}\n\nEsto no eliminará el historial asociado al producto.\n\n¿Confirmás la baja?',
      deactivated: 'Producto "{{name}}" dado de baja correctamente en Solaris.',
      error: 'No pude dar de baja el producto en Solaris.',
    },
    activate: {
      missingProduct:
        'Para reactivar un producto necesito que indiques cuál producto.',
      multipleProducts:
        'Encontré varios productos inactivos para "{{query}}". Necesito que seas más específico.',
      confirm:
        'Entendí que querés reactivar el siguiente producto:\n\nNombre: {{name}}\nSKU: {{sku}}\nStock actual: {{stock}}\nCategoría: {{category}}\n\n¿Confirmás la reactivación?',
      activated: 'Producto "{{name}}" reactivado correctamente en Solaris.',
      error: 'No pude reactivar el producto en Solaris.',
    },
  },
  stock: {
    missingFields: 'Para actualizar stock necesito que indiques: {{fields}}.',
    missingQuantity:
      'Para actualizar stock necesito que indiques una cantidad.',
    missingProduct: 'Para actualizar stock necesito que indiques el producto.',
    multipleProducts:
      'Encontré varios productos para "{{query}}". Por ahora necesito que seas más específico.',
    confirm:
      'Entendí que querés actualizar stock:\n\nProducto: {{product}}\nStock actual: {{currentStock}}\nNuevo stock: {{newStock}}\n\n¿Confirmás la operación?',
    searchError: 'No pude buscar el producto para actualizar stock.',
    negativeResult: 'El stock resultante no puede ser negativo.',
    updated: 'Stock actualizado correctamente. Nuevo stock: {{stock}}.',
    updateError: 'No pude actualizar el stock en Solaris.',
    defaultReason: 'Stock actualizado por Nova Copilot',
    noChange: 'El stock ya tiene ese valor. No realicé cambios.',
  },
  lowStock: {
    empty: 'No encontré productos con bajo stock.',
    found: 'Encontré {{count}} producto(s) con bajo stock.',
    error: 'No pude consultar productos con bajo stock en Solaris.',
  },
  dashboard: {
    summary:
      'Resumen del dashboard:\n\nVentas de hoy: {{todaySalesCount}}\nMonto vendido hoy: ${{todaySalesAmount}}\nProductos con bajo stock: {{lowStockProductsCount}}\nÓrdenes de proveedor enviadas: {{sent}}\nÓrdenes completadas: {{completed}}\nÓrdenes canceladas: {{cancelled}}',
    error: 'No pude consultar el dashboard en Solaris.',
  },
  categories: {
    create: {
      missingName: 'Para crear una categoría necesito que indiques el nombre.',
      confirm:
        'Entendí que querés crear la siguiente categoría:\n\nNombre: {{name}}\n\n¿Confirmás que la cree?',
      created: 'Categoría creada correctamente en Solaris.',
      error: 'No pude crear la categoría en Solaris.',
    },
  },
  suppliers: {
    create: {
      missingName: 'Para crear un proveedor necesito que indiques el nombre.',
      confirm:
        'Entendí que querés crear el siguiente proveedor:\n\nNombre: {{name}}\nContacto: {{contactName}}\nEmail: {{email}}\nTeléfono: {{phone}}\nDirección: {{address}}\n\n¿Confirmás que lo cree?',
      created: 'Proveedor creado correctamente en Solaris.',
      error: 'No pude crear el proveedor en Solaris.',
    },
    search: {
      askQuery: '¿Qué proveedor querés buscar?',
      notFound: 'No encontré proveedores que coincidan con "{{query}}".',
      found: 'Encontré {{count}} proveedor(es) para "{{query}}".',
      error: 'No pude buscar proveedores en Solaris.',
    },
    update: {
      missingSupplier:
        'Para actualizar un proveedor necesito que indiques cuál proveedor.',
      missingFields:
        'Para actualizar un proveedor necesito que indiques qué dato querés cambiar.',
      multipleSuppliers:
        'Encontré varios proveedores para "{{query}}". Necesito que seas más específico.',
      confirm:
        'Entendí que querés actualizar el siguiente proveedor:\n\nNombre: {{name}}\nContacto: {{contactName}}\nEmail: {{email}}\nTeléfono: {{phone}}\nDirección: {{address}}\nNotas: {{notes}}\n\n¿Confirmás la operación?',
      updated: 'Proveedor actualizado correctamente en Solaris.',
      error: 'No pude actualizar el proveedor en Solaris.',
    },
    delete: {
      missingSupplier:
        'Para eliminar un proveedor necesito que indiques cuál proveedor.',
      multipleSuppliers:
        'Encontré varios proveedores para "{{query}}". Necesito que seas más específico.',
      confirm:
        'Entendí que querés eliminar el siguiente proveedor:\n\nNombre: {{name}}\nContacto: {{contactName}}\nEmail: {{email}}\nTeléfono: {{phone}}\nEstado: {{active}}\n\n¿Confirmás la eliminación?',
      deleted: 'Proveedor "{{name}}" eliminado correctamente en Solaris.',
      error: 'No pude eliminar el proveedor en Solaris.',
    },
  },
  supplierOrders: {
    create: {
      missingSupplier:
        'Para crear un pedido a proveedor necesito que indiques el proveedor.',
      missingItems:
        'Para crear un pedido a proveedor necesito que indiques al menos un producto y su cantidad.',
      multipleSuppliers:
        'Encontré varios proveedores para "{{query}}". Necesito que seas más específico.',
      unresolvedProducts:
        'No pude resolver uno o más productos del pedido. Revisá las coincidencias e intentá ser más específico.',
      confirm:
        'Entendí que querés crear un pedido para {{supplier}} con:\n\n{{items}}\n\n¿Confirmás que lo cree?',
      created: 'Pedido a proveedor #{{id}} creado correctamente en Solaris.',
      invalidDraft: 'No pude crear el pedido porque faltan datos obligatorios.',
      error: 'No pude crear el pedido a proveedor en Solaris.',
    },
    actions: {
      missingOrderId: 'Necesito que indiques el número del pedido.',
    },
    show: {
      found: 'Encontré el pedido a proveedor #{{id}}.',
      error: 'No pude obtener el detalle del pedido a proveedor.',
    },
    sent: {
      updated: 'Pedido a proveedor #{{id}} marcado como enviado.',
      error: 'No pude marcar el pedido como enviado.',
    },
    completed: {
      confirm:
        '¿Confirmás marcar como completado el pedido a proveedor #{{id}}?',
      updated: 'Pedido a proveedor #{{id}} marcado como completado.',
      invalidStatus: 'Solo se pueden completar pedidos que estén enviados.',
      error: 'No pude completar el pedido a proveedor.',
    },
    cancel: {
      confirm: '¿Confirmás cancelar el pedido a proveedor #{{id}}?',
      updated: 'Pedido a proveedor #{{id}} cancelado.',
      completedNotAllowed: 'No se puede cancelar un pedido completado.',
      error: 'No pude cancelar el pedido a proveedor.',
    },
    delete: {
      confirm:
        '¿Confirmás eliminar el pedido a proveedor #{{id}}? Esta acción no se puede deshacer.',
      deleted: 'Pedido a proveedor #{{id}} eliminado.',
      completedNotAllowed: 'No se puede eliminar un pedido completado.',
      error: 'No pude eliminar el pedido a proveedor.',
    },
    update: {
      confirm: '¿Confirmás actualizar el pedido a proveedor #{{id}}?',
      updated: 'Pedido a proveedor #{{id}} actualizado correctamente.',
      onlyDraft: 'Solo se pueden actualizar pedidos en borrador.',
      unresolvedProduct:
        'No pude resolver el producto "{{query}}". Necesito que seas más específico.',
      invalidDraft:
        'No pude actualizar el pedido porque faltan datos obligatorios.',
      error: 'No pude actualizar el pedido a proveedor.',
      productNotInOrder:
        'The product "{{query}}" is not in the supplier order.',
      emptyOrder: 'The supplier order cannot be left without products.',
      confirmDetailed:
        'Entendí que querés actualizar el pedido a proveedor #{{id}}.\n\nCambios:\n\n{{changes}}\n\n¿Confirmás estos cambios?',
      confirmSupplierChange: 'Proveedor:\n- Desde: {{from}}\n- Hasta: {{to}}',
      confirmItemsToAdd: 'Agregar productos:\n{{items}}',
      confirmItemsToUpdate: 'Actualizar cantidades:\n{{items}}',
      confirmItemsToRemove: 'Eliminar productos:\n{{items}}',
      missingQuantity:
        'Para agregar un producto al pedido a proveedor, necesito que indiques la cantidad.',
      noChanges:
        'No pude identificar cambios para aplicar al pedido a proveedor.',
    },
  },
  sales: {
    list: {
      found: 'Encontré {{count}} venta(s){{dateSuffix}}.',
      empty: 'No encontré ventas{{dateSuffix}}.',
      error: 'No pude consultar las ventas en Solaris.',
    },
    show: {
      missingSaleId: 'Necesito que indiques el número de venta. Ejemplo: "Ver venta #13".',
      found: 'Encontré la venta #{{id}}.',
      error: 'No pude obtener el detalle de la venta.',
    },
    summary: {
      found:
        'Resumen de ventas del {{date}}: {{count}} venta(s) por un total de ${{total}}.',
      error: 'No pude obtener el resumen de ventas del día.',
    },
    paymentMethod: {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Tarjeta de débito',
      CREDIT_CARD: 'Tarjeta de crédito',
      TRANSFER: 'Transferencia',
      OTHER: 'Otro',
    },
    create: {
      missingItems:
        'Para registrar una venta necesito que indiques al menos un producto con cantidad. Ejemplo: "Crear venta en efectivo con 2 Coca Cola".',
      unresolvedProducts:
        'No pude identificar con certeza uno o más productos. Probá ser más específico con el nombre.',
      confirm:
        'Entendí que querés registrar la siguiente venta:\n\nMedio de pago: {{paymentMethod}}\n\nProductos:\n{{items}}\n\n¿Confirmás la venta?',
      invalidDraft: 'El borrador de venta no tiene el formato esperado.',
      created: 'Venta #{{id}} registrada correctamente. Total: ${{total}}.',
      error: 'No pude registrar la venta en Solaris.',
    },
  },
  customers: {
    search: {
      askQuery:
        'Indicá qué cliente querés buscar. Ejemplo: "Buscar cliente Lucca Vergara".',
      found: 'Encontré {{count}} cliente(s) para "{{query}}".',
      notFound: 'No encontré clientes para "{{query}}".',
      error: 'No pude buscar clientes en Solaris.',
    },
    show: {
      missingCustomerId:
        'Necesito el número de cliente. Ejemplo: "Ver cliente #5".',
      found: 'Encontré el cliente #{{id}}.',
      error: 'No pude obtener el detalle del cliente.',
    },
  },
  fiscalDocuments: {
    list: {
      found: 'Encontré {{count}} comprobante(s) fiscal(es).',
      empty: 'No hay comprobantes fiscales emitidos.',
      error: 'No pude consultar los comprobantes fiscales.',
    },
    show: {
      missingDocumentId:
        'Necesito el número de comprobante. Ejemplo: "Ver comprobante #4".',
      found: 'Encontré el comprobante fiscal #{{id}}.',
      error: 'No pude obtener el detalle del comprobante.',
    },
    emit: {
      missingSaleId:
        'Necesito el número de venta a facturar. Ejemplo: "Facturar venta #13".',
      alreadyInvoiced: 'La venta #{{id}} ya tiene un comprobante fiscal emitido.',
      multipleCustomers:
        'Encontré varios clientes para "{{query}}". Necesito que seas más específico.',
      defaultCustomer: 'Consumidor Final',
      confirm:
        'Entendí que querés emitir factura para la venta #{{saleId}} (${{total}}) a nombre de {{customer}}.\n\n¿Confirmás la emisión?',
      invalidDraft: 'El borrador de facturación no tiene el formato esperado.',
      created: 'Comprobante fiscal #{{id}} emitido con estado {{status}}.',
      error: 'No pude emitir el comprobante fiscal.',
    },
  },
};
