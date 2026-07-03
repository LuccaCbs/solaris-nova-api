import { en } from './en';

export const fr: typeof en = {
  fields: {
    name: 'nom',
    price: 'prix',
    initialStock: 'stock initial',
    product: 'produit',
    quantity: 'quantité',
  },

  conversation: {
    restarted: 'Conversation redémarrée.',
    cancelled: "Opération annulée. Je n'ai effectué aucune modification.",
    unknownIntent:
      "Je n'ai pas pu identifier clairement l'action demandée. Pouvez-vous reformuler ?",
  },

  products: {
    search: {
      askQuery: 'Quel produit souhaitez-vous rechercher ?',
      notFound: 'Je n’ai trouvé aucun produit correspondant à "{{query}}".',
      exactNotFoundWithSuggestions:
        'Je n’ai trouvé aucun produit exact pour "{{query}}". Peut-être vouliez-vous dire :',
      found: '{{count}} produit(s) trouvé(s) pour « {{query}} ».',
      error: 'Impossible de rechercher les produits dans Solaris.',
    },

    create: {
      pendingMismatch:
        "L'action en attente ne correspond pas à une création de produit.",
      invalidDraft:
        'Les données du produit ne sont pas dans le format attendu.',
      missingFields: 'Pour créer le produit, il me manque : {{fields}}.',
      confirm:
        "J'ai compris que vous souhaitez créer ce produit :\n\nNom : {{name}}\nPrix : ${{price}}\nStock initial : {{stock}}\nCatégorie : {{category}}\n\nConfirmez-vous la création ?",
      multipleCategories:
        'Plusieurs catégories correspondent à "{{category}}". Soyez plus précis.',
      categoryFallbackConfirm:
        'Je n’ai pas trouvé la catégorie "{{category}}".\n\nJe peux créer le produit dans la catégorie GÉNÉRAL.\n\nConfirmez-vous ?',
      defaultDescription: 'Produit créé par Nova Copilot',
      created: 'Produit créé avec succès dans Solaris.',
      error: 'Impossible de créer le produit dans Solaris.',
    },

    update: {
      missingProduct: 'Veuillez préciser le produit à modifier.',
      missingFields: 'Veuillez indiquer quelles informations modifier.',
      multipleProducts:
        'Plusieurs produits correspondent à "{{query}}". Soyez plus précis.',
      confirm:
        'Vous souhaitez modifier ce produit :\n\nProduit actuel : {{name}}\nNouveau nom : {{newName}}\nSKU : {{sku}}\nPrix : ${{price}}\nDescription : {{description}}\nCatégorie : {{category}}\n\nConfirmez-vous ?',
      updated: 'Produit mis à jour avec succès.',
      error: 'Impossible de mettre à jour le produit.',
    },

    deactivate: {
      missingProduct: 'Veuillez préciser le produit à désactiver.',
      multipleProducts:
        'Plusieurs produits correspondent à "{{query}}". Soyez plus précis.',
      confirm:
        "Vous souhaitez désactiver ce produit :\n\nNom : {{name}}\nSKU : {{sku}}\nStock actuel : {{stock}}\nCatégorie : {{category}}\n\nL'historique du produit sera conservé.\n\nConfirmez-vous ?",
      deactivated: 'Produit "{{name}}" désactivé avec succès.',
      error: 'Impossible de désactiver le produit.',
    },

    activate: {
      missingProduct: 'Veuillez préciser le produit à réactiver.',
      multipleProducts:
        'Plusieurs produits inactifs correspondent à "{{query}}". Soyez plus précis.',
      confirm:
        'Vous souhaitez réactiver ce produit :\n\nNom : {{name}}\nSKU : {{sku}}\nStock actuel : {{stock}}\nCatégorie : {{category}}\n\nConfirmez-vous ?',
      activated: 'Produit "{{name}}" réactivé avec succès.',
      error: 'Impossible de réactiver le produit.',
    },
  },

  stock: en.stock,
  lowStock: en.lowStock,
  dashboard: en.dashboard,

  categories: {
    create: {
      missingName: 'Veuillez indiquer le nom de la catégorie.',
      confirm:
        'Vous souhaitez créer cette catégorie :\n\nNom : {{name}}\n\nConfirmez-vous ?',
      created: 'Catégorie créée avec succès.',
      error: 'Impossible de créer la catégorie.',
    },
  },

  suppliers: en.suppliers,

  supplierOrders: {
    create: {
      missingSupplier: 'Veuillez préciser le fournisseur.',
      missingItems: 'Veuillez indiquer au moins un produit et une quantité.',
      multipleSuppliers: 'Plusieurs fournisseurs correspondent à "{{query}}".',
      unresolvedProducts: "Impossible d'identifier un ou plusieurs produits.",
      confirm:
        'Vous souhaitez créer une commande pour {{supplier}} avec :\n\n{{items}}\n\nConfirmez-vous ?',
      created: 'Commande fournisseur #{{id}} créée avec succès.',
      invalidDraft:
        'Impossible de créer la commande car des informations sont manquantes.',
      error: 'Impossible de créer la commande fournisseur.',
    },

    actions: {
      missingOrderId: 'Veuillez indiquer le numéro de la commande.',
    },

    show: {
      found: 'Commande fournisseur n°{{id}} trouvée.',
      error: "Impossible d'obtenir les détails de la commande.",
    },

    sent: {
      updated: 'Commande fournisseur n°{{id}} marquée comme envoyée.',
      error: 'Impossible de marquer la commande comme envoyée.',
    },

    completed: {
      confirm:
        'Confirmez-vous la clôture de la commande fournisseur n°{{id}} ?',
      updated: 'Commande fournisseur n°{{id}} terminée.',
      invalidStatus: 'Seules les commandes envoyées peuvent être terminées.',
      error: 'Impossible de terminer la commande.',
    },

    cancel: {
      confirm:
        "Confirmez-vous l'annulation de la commande fournisseur n°{{id}} ?",
      updated: 'Commande fournisseur n°{{id}} annulée.',
      completedNotAllowed: 'Une commande terminée ne peut pas être annulée.',
      error: "Impossible d'annuler la commande.",
    },

    delete: {
      confirm:
        'Confirmez-vous la suppression de la commande fournisseur n°{{id}} ? Cette action est irréversible.',
      deleted: 'Commande fournisseur n°{{id}} supprimée.',
      completedNotAllowed: 'Une commande terminée ne peut pas être supprimée.',
      error: 'Impossible de supprimer la commande.',
    },
    update: {
      confirm:
        'Confirmez-vous la mise à jour de la commande fournisseur n°{{id}} ?',
      updated: 'Commande fournisseur n°{{id}} mise à jour avec succès.',
      onlyDraft:
        'Seules les commandes fournisseur en brouillon peuvent être mises à jour.',
      unresolvedProduct:
        'Impossible d’identifier le produit "{{query}}". Veuillez être plus précis.',
      invalidDraft:
        'Impossible de mettre à jour la commande car des informations obligatoires sont manquantes.',
      error: 'Impossible de mettre à jour la commande fournisseur.',
      productNotInOrder:
        'Le produit "{{query}}" ne se trouve pas dans la commande fournisseur.',
      emptyOrder:
        'La commande fournisseur ne peut pas être laissée sans produits.',
      confirmDetailed:
        'J’ai compris que vous souhaitez mettre à jour la commande fournisseur n°{{id}}.\n\nModifications :\n\n{{changes}}\n\nConfirmez-vous ces modifications ?',
      confirmSupplierChange: 'Fournisseur :\n- De : {{from}}\n- À : {{to}}',
      confirmItemsToAdd: 'Ajouter des produits :\n{{items}}',
      confirmItemsToUpdate: 'Mettre à jour les quantités :\n{{items}}',
      confirmItemsToRemove: 'Supprimer des produits :\n{{items}}',
      missingQuantity:
        'Pour ajouter un produit à la commande fournisseur, vous devez indiquer la quantité.',
      noChanges:
        'Je n’ai identifié aucune modification à appliquer à la commande fournisseur.',
    },
  },
  sales: en.sales,
  customers: en.customers,
  fiscalDocuments: en.fiscalDocuments,
};
