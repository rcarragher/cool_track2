// Type definitions for i18n resources
export interface CommonTranslations {
  buttons: {
    add: string;
    cancel: string;
    close: string;
    delete: string;
    edit: string;
    save: string;
    confirm: string;
    loadMore: string;
    previous: string;
    next: string;
  };
  labels: {
    name: string;
    category: string;
    quantity: string;
    device: string;
    dateAdded: string;
    expirationDate: string;
    actions: string;
    search: string;
    filter: string;
  };
  placeholders: {
    enterItemName: string;
    enterDeviceName: string;
    selectCategory: string;
    selectDevice: string;
    selectType: string;
    searchItems: string;
  };
  validation: {
    required: string;
    pleaseSelectDevice: string;
    pleaseSelectCategory: string;
  };
  status: {
    loading: string;
    error: string;
    success: string;
    expired: string;
    expiring: string;
    noExpiration: string;
  };
  categories: {
    meat: string;
    cocktail: string;
    fruitVeg: string;
    prepared: string;
  };
  deviceTypes: {
    refrigerator: string;
    freezer: string;
  };
}

export interface DashboardTranslations {
  title: string;
  subtitle: string;
  loading: string;
  backToDashboard: string;
  cards: {
    totalItems: string;
    expiringSoon: string;
    expiredItems: string;
    addItems: string;
    subtitles: {
      next3Days: string;
      needsAttention: string;
      addNewInventory: string;
    };
  };
  sections: {
    allItems: {
      title: string;
      description: string;
    };
    expiringSoon: {
      title: string;
      description: string;
    };
    expired: {
      title: string;
      description: string;
    };
  };
  pagination: {
    showing: string;
    itemsPerPage: string;
    pageOf: string;
  };
}

export interface InventoryTranslations {
  title: string;
  addModal: {
    title: string;
    helpText: string;
  };
  table: {
    headers: {
      item: string;
      category: string;
      quantity: string;
      added: string;
      expires: string;
      device: string;
      actions: string;
    };
    legend: {
      refrigerator: string;
      freezer: string;
    };
    emptyState: {
      title: string;
      description: string;
    };
    footer: {
      showing: string;
    };
  };
  search: {
    title: string;
    showTop: string;
    items: string;
    all: string;
  };
  expiration: {
    expiredDays: string;
    expiresIn: string;
    expiresOn: string;
  };
  toast: {
    itemAdded: {
      title: string;
      description: string;
    };
    itemDeleted: {
      title: string;
      description: string;
    };
    error: {
      title: string;
      addFailed: string;
      deleteFailed: string;
    };
    comingSoon: {
      edit: string;
      editDescription: string;
      loadMore: string;
      loadMoreDescription: string;
    };
  };
  confirmations: {
    deleteItem: string;
  };
  fallbacks: {
    unknownDevice: string;
  };
}

export interface SettingsTranslations {
  title: string;
  sections: {
    deviceManagement: string;
    displaySettings: string;
  };
  deviceForm: {
    addDevice: string;
    deviceName: string;
    deviceType: string;
    adding: string;
  };
  displayForm: {
    defaultItemsToShow: string;
    expirationWarningDays: string;
  };
  toast: {
    deviceAdded: {
      title: string;
      description: string;
    };
    deviceDeleted: {
      title: string;
      description: string;
    };
    error: {
      title: string;
      addFailed: string;
      deleteFailed: string;
    };
    comingSoon: {
      edit: string;
      editDescription: string;
    };
  };
  confirmations: {
    deleteDevice: string;
  };
}

// Main resources type
export interface Resources {
  common: CommonTranslations;
  dashboard: DashboardTranslations;
  inventory: InventoryTranslations;
  settings: SettingsTranslations;
}

// Declare module for react-i18next to provide type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
  }
}