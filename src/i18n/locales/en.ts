export const en = {
  fields: {
    name: 'name',
    price: 'price',
    initialStock: 'initial stock',
    product: 'product',
    quantity: 'quantity',
  },
  conversation: {
    restarted: 'Conversation restarted.',
    cancelled: 'Operation cancelled. I did not make any changes.',
    unknownIntent:
      'I could not clearly identify what action you want to perform. Could you rephrase it?',
  },
  products: {
    search: {
      askQuery: 'What product do you want to search for?',
      notFound: 'I could not find products matching "{{query}}".',
      exactNotFoundWithSuggestions:
        'I could not find exact products for "{{query}}". Maybe you meant one of these:',
      found: 'I found {{count}} product(s) for "{{query}}".',
      error: 'I could not search products in Solaris.',
    },
    create: {
      pendingMismatch: 'The pending action is not a product creation.',
      invalidDraft: 'The product draft does not have the expected format.',
      missingFields:
        'To create the product, I need you to provide: {{fields}}.',
      confirm:
        'I understood that you want to create this product:\n\nName: {{name}}\nPrice: ${{price}}\nInitial stock: {{stock}}\nCategory: {{category}}\n\nDo you confirm that I should create it?',
      multipleCategories:
        'I found several categories for "{{category}}". I need you to be more specific.',
      categoryFallbackConfirm:
        'I could not find the category "{{category}}".\n\nI can create the product in the GENERAL category.\n\nDo you confirm that I should create it in GENERAL?',
      defaultDescription: 'Product created by Nova Copilot',
      created: 'Product created successfully in Solaris.',
      error: 'I could not create the product in Solaris.',
    },
    update: {
      missingProduct:
        'To update a product, I need you to specify which product.',
      missingFields:
        'To update a product, I need you to specify what data you want to change.',
      multipleProducts:
        'I found several products for "{{query}}". I need you to be more specific.',
      confirm:
        'I understood that you want to update the following product:\n\nCurrent product: {{name}}\nNew name: {{newName}}\nSKU: {{sku}}\nPrice: ${{price}}\nDescription: {{description}}\nCategory: {{category}}\n\nDo you confirm the operation?',
      updated: 'Product updated successfully in Solaris.',
      error: 'I could not update the product in Solaris.',
    },
    deactivate: {
      missingProduct:
        'To deactivate a product, I need you to specify which product.',
      multipleProducts:
        'I found several products for "{{query}}". I need you to be more specific.',
      confirm:
        'I understood that you want to deactivate the following product:\n\nName: {{name}}\nSKU: {{sku}}\nCurrent stock: {{stock}}\nCategory: {{category}}\n\nThis will not delete the product history.\n\nDo you confirm deactivation?',
      deactivated: 'Product "{{name}}" deactivated successfully in Solaris.',
      error: 'I could not deactivate the product in Solaris.',
    },
    activate: {
      missingProduct:
        'To reactivate a product, I need you to specify which product.',
      multipleProducts:
        'I found several inactive products for "{{query}}". I need you to be more specific.',
      confirm:
        'I understood that you want to reactivate the following product:\n\nName: {{name}}\nSKU: {{sku}}\nCurrent stock: {{stock}}\nCategory: {{category}}\n\nDo you confirm reactivation?',
      activated: 'Product "{{name}}" reactivated successfully in Solaris.',
      error: 'I could not reactivate the product in Solaris.',
    },
  },
  stock: {
    missingFields: 'To update stock, I need you to provide: {{fields}}.',
    missingQuantity: 'To update stock, I need you to provide a quantity.',
    missingProduct: 'To update stock, I need you to provide the product.',
    multipleProducts:
      'I found several products for "{{query}}". For now, I need you to be more specific.',
    confirm:
      'I understood that you want to update stock:\n\nProduct: {{product}}\nCurrent stock: {{currentStock}}\nNew stock: {{newStock}}\n\nDo you confirm the operation?',
    searchError: 'I could not search the product to update stock.',
    negativeResult: 'The resulting stock cannot be negative.',
    updated: 'Stock updated successfully. New stock: {{stock}}.',
    updateError: 'I could not update the stock in Solaris.',
    defaultReason: 'Stock updated by Nova Copilot',
    noChange: 'The stock already has that value. I did not make any changes.',
  },
  lowStock: {
    empty: 'I could not find low-stock products.',
    found: 'I found {{count}} low-stock product(s).',
    error: 'I could not check low-stock products in Solaris.',
  },
  dashboard: {
    summary:
      'Dashboard summary:\n\nToday sales: {{todaySalesCount}}\nToday sales amount: ${{todaySalesAmount}}\nLow-stock products: {{lowStockProductsCount}}\nSupplier orders sent: {{sent}}\nCompleted orders: {{completed}}\nCancelled orders: {{cancelled}}',
    error: 'I could not check the dashboard in Solaris.',
  },
  categories: {
    create: {
      missingName: 'To create a category, I need you to provide the name.',
      confirm:
        'I understood that you want to create this category:\n\nName: {{name}}\n\nDo you confirm that I should create it?',
      created: 'Category created successfully in Solaris.',
      error: 'I could not create the category in Solaris.',
    },
  },
  suppliers: {
    create: {
      missingName:
        'To create a supplier, I need you to provide the supplier name.',

      confirm:
        'I understood that you want to create the following supplier:\n\nName: {{name}}\nContact: {{contactName}}\nEmail: {{email}}\nPhone: {{phone}}\nAddress: {{address}}\n\nDo you confirm that I should create it?',

      created: 'Supplier created successfully in Solaris.',

      error: 'I could not create the supplier in Solaris.',
    },
    search: {
      askQuery: 'What supplier do you want to search for?',
      notFound: 'I could not find suppliers matching "{{query}}".',
      found: 'I found {{count}} supplier(s) for "{{query}}".',
      error: 'I could not search suppliers in Solaris.',
    },
    update: {
      missingSupplier:
        'To update a supplier, I need you to specify which supplier.',
      missingFields:
        'To update a supplier, I need you to specify what data you want to change.',
      multipleSuppliers:
        'I found several suppliers for "{{query}}". I need you to be more specific.',
      confirm:
        'I understood that you want to update the following supplier:\n\nName: {{name}}\nContact: {{contactName}}\nEmail: {{email}}\nPhone: {{phone}}\nAddress: {{address}}\nNotes: {{notes}}\n\nDo you confirm the operation?',
      updated: 'Supplier updated successfully in Solaris.',
      error: 'I could not update the supplier in Solaris.',
    },
    delete: {
      missingSupplier:
        'To delete a supplier, I need you to specify which supplier.',
      multipleSuppliers:
        'I found several suppliers for "{{query}}". I need you to be more specific.',
      confirm:
        'I understood that you want to delete the following supplier:\n\nName: {{name}}\nContact: {{contactName}}\nEmail: {{email}}\nPhone: {{phone}}\nStatus: {{active}}\n\nDo you confirm deletion?',
      deleted: 'Supplier "{{name}}" deleted successfully in Solaris.',
      error: 'I could not delete the supplier in Solaris.',
    },
  },
  supplierOrders: {
    create: {
      missingSupplier:
        'To create a supplier order, I need you to specify the supplier.',
      missingItems:
        'To create a supplier order, I need at least one product and quantity.',
      multipleSuppliers:
        'I found several suppliers for "{{query}}". I need you to be more specific.',
      unresolvedProducts:
        'I could not resolve one or more products in the order. Please be more specific.',
      confirm:
        'I understood that you want to create an order for {{supplier}} with:\n\n{{items}}\n\nDo you confirm that I should create it?',
      created: 'Supplier order #{{id}} created successfully in Solaris.',
      invalidDraft:
        'I could not create the order because required data is missing.',
      error: 'I could not create the supplier order in Solaris.',
    },
    actions: {
      missingOrderId: 'I need you to specify the order number.',
    },
    show: {
      found: 'I found supplier order #{{id}}.',
      error: 'I could not get the supplier order details.',
    },
    sent: {
      updated: 'Supplier order #{{id}} marked as sent.',
      error: 'I could not mark the supplier order as sent.',
    },
    completed: {
      confirm: 'Do you confirm marking supplier order #{{id}} as completed?',
      updated: 'Supplier order #{{id}} marked as completed.',
      invalidStatus: 'Only sent supplier orders can be completed.',
      error: 'I could not complete the supplier order.',
    },
    cancel: {
      confirm: 'Do you confirm cancelling supplier order #{{id}}?',
      updated: 'Supplier order #{{id}} cancelled.',
      completedNotAllowed: 'Completed supplier orders cannot be cancelled.',
      error: 'I could not cancel the supplier order.',
    },
    delete: {
      confirm:
        'Do you confirm deleting supplier order #{{id}}? This action cannot be undone.',
      deleted: 'Supplier order #{{id}} deleted.',
      completedNotAllowed: 'Completed supplier orders cannot be deleted.',
      error: 'I could not delete the supplier order.',
    },
    update: {
      confirm: 'Do you confirm updating supplier order #{{id}}?',
      updated: 'Supplier order #{{id}} updated successfully.',
      onlyDraft: 'Only draft supplier orders can be updated.',
      unresolvedProduct:
        'I could not resolve the product "{{query}}". Please be more specific.',
      invalidDraft:
        'I could not update the supplier order because required data is missing.',
      error: 'I could not update the supplier order.',
      productNotInOrder:
        'El producto "{{query}}" no está en el pedido a proveedor.',
      emptyOrder: 'El pedido a proveedor no puede quedar sin productos.',
      confirmDetailed:
        'I understood that you want to update supplier order #{{id}}.\n\nChanges:\n\n{{changes}}\n\nDo you confirm these changes?',
      confirmSupplierChange: 'Supplier:\n- From: {{from}}\n- To: {{to}}',
      confirmItemsToAdd: 'Add products:\n{{items}}',
      confirmItemsToUpdate: 'Update quantities:\n{{items}}',
      confirmItemsToRemove: 'Remove products:\n{{items}}',
      missingQuantity:
        'To add a product to the supplier order, I need you to specify the quantity.',
      noChanges:
        'I could not identify any changes to apply to the supplier order.',
    },
  },
  sales: {
    list: {
      found:
        'I found {{count}} sale(s){{dateSuffix}}{{scopeSuffix}} ({{totalCount}} total).',
      empty: 'I found no sales{{dateSuffix}}{{scopeSuffix}}.',
      truncated: 'Showing the {{shown}} most recent sales out of {{total}}.',
      volumeWarning:
        'There are {{total}} sales in this period (more than {{threshold}}). For large volumes I recommend exporting Excel with a from/to date range, e.g. "Sales report from 07/01/2026 to 07/06/2026".',
      error: 'I could not fetch sales from Solaris.',
    },
    show: {
      missingSaleId:
        'I need the sale number. Example: "Show sale #13".',
      found: 'I found sale #{{id}}.',
      error: 'I could not fetch the sale details.',
    },
    summary: {
      found:
        'Sales summary for {{date}}: {{count}} sale(s) totaling ${{total}}.',
      error: 'I could not fetch the daily sales summary.',
    },
    paymentMethod: {
      CASH: 'Cash',
      DEBIT_CARD: 'Debit card',
      CREDIT_CARD: 'Credit card',
      TRANSFER: 'Transfer',
      OTHER: 'Other',
    },
    create: {
      missingItems:
        'To register a sale I need at least one product with quantity. Example: "Create cash sale with 2 Coca Cola".',
      unresolvedProducts:
        'I could not identify one or more products with certainty. Try being more specific.',
      confirm:
        'I understood that you want to register this sale:\n\nPayment method: {{paymentMethod}}\n\nItems:\n{{items}}\n\nDo you confirm the sale?',
      invalidDraft: 'The sale draft is not in the expected format.',
      created: 'Sale #{{id}} registered successfully. Total: ${{total}}.',
      error: 'I could not register the sale in Solaris.',
    },
  },
  reports: {
    missingModule:
      'I need to know which report to generate. Example: "Sales report for today".',
    moduleNotSupported:
      'I cannot generate reports for "{{module}}" yet. Sales is available now.',
    sales: {
      ready:
        'Done. The sales report has {{count}} record(s) from {{from}} to {{to}}. Use the link to download the Excel file.',
      error: 'I could not generate the sales report.',
    },
  },
  customers: {
    search: {
      askQuery:
        'Tell me which customer to search for. Example: "Search customer John Doe".',
      found: 'I found {{count}} customer(s) for "{{query}}".',
      notFound: 'I found no customers for "{{query}}".',
      error: 'I could not search customers in Solaris.',
    },
    show: {
      missingCustomerId:
        'I need the customer number. Example: "Show customer #5".',
      found: 'I found customer #{{id}}.',
      error: 'I could not fetch the customer details.',
    },
  },
  fiscalDocuments: {
    list: {
      found: 'I found {{count}} fiscal document(s).',
      empty: 'There are no fiscal documents yet.',
      error: 'I could not fetch fiscal documents.',
    },
    show: {
      missingDocumentId:
        'I need the document number. Example: "Show invoice #4".',
      found: 'I found fiscal document #{{id}}.',
      error: 'I could not fetch the document details.',
    },
    emit: {
      missingSaleId:
        'I need the sale number to invoice. Example: "Invoice sale #13".',
      alreadyInvoiced: 'Sale #{{id}} already has a fiscal document.',
      multipleCustomers:
        'I found multiple customers for "{{query}}". Please be more specific.',
      defaultCustomer: 'Final consumer',
      confirm:
        'I understood that you want to issue an invoice for sale #{{saleId}} (${{total}}) to {{customer}}.\n\nDo you confirm?',
      invalidDraft: 'The invoice draft is not in the expected format.',
      created: 'Fiscal document #{{id}} issued with status {{status}}.',
      error: 'I could not issue the fiscal document.',
    },
  },
};
