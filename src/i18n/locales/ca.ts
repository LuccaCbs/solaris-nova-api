import { en } from './en';

export const ca: typeof en = {
  fields: {
    name: 'nom',
    price: 'preu',
    initialStock: 'estoc inicial',
    product: 'producte',
    quantity: 'quantitat',
  },

  conversation: {
    restarted: 'Conversació reiniciada.',
    cancelled: "Operació cancel·lada. No s'ha fet cap canvi.",
    unknownIntent:
      "No he pogut identificar clarament l'acció. Pots reformular-la?",
  },

  products: {
    search: {
      askQuery: 'Quin producte vols cercar?',
      notFound: 'No he trobat productes que coincideixin amb "{{query}}".',
      exactNotFoundWithSuggestions:
        'No he trobat coincidències exactes. Potser et refereixes a:',
      found: "He trobat {{count}} producte(s) per a '{{query}}'.",
      error: 'No he pogut cercar productes a Solaris.',
    },

    create: {
      pendingMismatch:
        'L’acció pendent no correspon a la creació d’un producte.',
      invalidDraft: 'L’esborrany del producte no és vàlid.',
      missingFields: 'Per crear el producte em falta: {{fields}}.',
      confirm:
        'He entès que vols crear aquest producte:\n\nNom: {{name}}\nPreu: ${{price}}\nEstoc inicial: {{stock}}\nCategoria: {{category}}\n\nHo confirmes?',
      multipleCategories: 'He trobat diverses categories per "{{category}}".',
      categoryFallbackConfirm:
        'No he trobat la categoria "{{category}}".\n\nPuc crear-lo a GENERAL.\n\nHo confirmes?',
      defaultDescription: 'Producte creat per Nova Copilot',
      created: 'Producte creat correctament.',
      error: 'No he pogut crear el producte.',
    },

    update: {
      missingProduct: 'Cal indicar quin producte vols modificar.',
      missingFields: 'Cal indicar què vols modificar.',
      multipleProducts: 'He trobat diversos productes per "{{query}}".',
      confirm:
        'He entès que vols modificar aquest producte:\n\nProducte actual: {{name}}\nNou nom: {{newName}}\nSKU: {{sku}}\nPreu: ${{price}}\nDescripció: {{description}}\nCategoria: {{category}}\n\nHo confirmes?',
      updated: 'Producte actualitzat correctament.',
      error: 'No he pogut actualitzar el producte.',
    },

    deactivate: {
      missingProduct: 'Cal indicar quin producte vols desactivar.',
      multipleProducts: 'He trobat diversos productes per "{{query}}".',
      confirm:
        'He entès que vols desactivar aquest producte:\n\nNom: {{name}}\nSKU: {{sku}}\nEstoc actual: {{stock}}\nCategoria: {{category}}\n\nL’historial es conservarà.\n\nHo confirmes?',
      deactivated: 'Producte "{{name}}" desactivat correctament.',
      error: 'No he pogut desactivar el producte.',
    },

    activate: {
      missingProduct: 'Cal indicar quin producte vols reactivar.',
      multipleProducts:
        'He trobat diversos productes inactius per "{{query}}".',
      confirm:
        'He entès que vols reactivar aquest producte:\n\nNom: {{name}}\nSKU: {{sku}}\nEstoc actual: {{stock}}\nCategoria: {{category}}\n\nHo confirmes?',
      activated: 'Producte "{{name}}" reactivat correctament.',
      error: 'No he pogut reactivar el producte.',
    },
  },

  stock: en.stock,
  lowStock: en.lowStock,
  dashboard: en.dashboard,
  categories: en.categories,
  suppliers: en.suppliers,

  supplierOrders: {
    create: {
      missingSupplier: 'Cal indicar el proveïdor.',
      missingItems: 'Cal indicar almenys un producte i una quantitat.',
      multipleSuppliers: 'He trobat diversos proveïdors per "{{query}}".',
      unresolvedProducts: 'No he pogut identificar un o més productes.',
      confirm:
        'He entès que vols crear una comanda per {{supplier}} amb:\n\n{{items}}\n\nHo confirmes?',
      created: 'Comanda al proveïdor #{{id}} creada correctament.',
      invalidDraft: 'No he pogut crear la comanda perquè falten dades.',
      error: 'No he pogut crear la comanda al proveïdor.',
    },

    actions: {
      missingOrderId: 'Cal indicar el número de la comanda.',
    },

    show: {
      found: 'He trobat la comanda al proveïdor #{{id}}.',
      error: 'No he pogut obtenir el detall de la comanda.',
    },

    sent: {
      updated: 'Comanda al proveïdor #{{id}} marcada com a enviada.',
      error: 'No he pogut marcar la comanda com a enviada.',
    },

    completed: {
      confirm: 'Confirmes marcar com a completada la comanda #{{id}}?',
      updated: 'Comanda al proveïdor #{{id}} completada.',
      invalidStatus: 'Només es poden completar comandes enviades.',
      error: 'No he pogut completar la comanda.',
    },

    cancel: {
      confirm: 'Confirmes cancel·lar la comanda #{{id}}?',
      updated: 'Comanda al proveïdor #{{id}} cancel·lada.',
      completedNotAllowed: 'No es pot cancel·lar una comanda completada.',
      error: 'No he pogut cancel·lar la comanda.',
    },

    delete: {
      confirm:
        'Confirmes eliminar la comanda #{{id}}? Aquesta acció no es pot desfer.',
      deleted: 'Comanda al proveïdor #{{id}} eliminada.',
      completedNotAllowed: 'No es pot eliminar una comanda completada.',
      error: 'No he pogut eliminar la comanda.',
    },
    update: {
      confirm: 'Confirmes actualitzar la comanda al proveïdor #{{id}}?',
      updated: 'Comanda al proveïdor #{{id}} actualitzada correctament.',
      onlyDraft: 'Només es poden actualitzar comandes en esborrany.',
      unresolvedProduct:
        'No he pogut identificar el producte "{{query}}". Necessito que siguis més específic.',
      invalidDraft:
        'No he pogut actualitzar la comanda perquè falten dades obligatòries.',
      error: 'No he pogut actualitzar la comanda al proveïdor.',
      productNotInOrder:
        'El producte "{{query}}" no es troba a la comanda al proveïdor.',
      emptyOrder: 'La comanda al proveïdor no pot quedar sense productes.',
      confirmDetailed:
        'He entès que vols actualitzar la comanda al proveïdor #{{id}}.\n\nCanvis:\n\n{{changes}}\n\nConfirmes aquests canvis?',
      confirmSupplierChange: 'Proveïdor:\n- De: {{from}}\n- A: {{to}}',
      confirmItemsToAdd: 'Afegir productes:\n{{items}}',
      confirmItemsToUpdate: 'Actualitzar quantitats:\n{{items}}',
      confirmItemsToRemove: 'Eliminar productes:\n{{items}}',
      missingQuantity:
        'Per afegir un producte a la comanda al proveïdor, cal que indiquis la quantitat.',
      noChanges:
        'No he identificat cap canvi per aplicar a la comanda al proveïdor.',
    },
  },
};
