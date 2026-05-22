/**
 * IndexedDB Offline Engine with LocalStorage Fallback
 * @license Apache-2.0
 */

import { Product, Customer, Bill, InventoryMovement, StoreConfig, AlertNotification } from '../types';

const DB_NAME = 'FlexBill_LocalDB';
const DB_VERSION = 1;

class OfflineDB {
  private useFallback = false;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB().catch((err) => {
      console.warn('⚡ Custom IndexedDB unavailable, setting up graceful LocalStorage storage backup:', err);
      this.useFallback = true;
    });
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        this.useFallback = true;
        reject(new Error('IndexedDB not supported in this environment.'));
        return;
      }

      // Open database
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        this.useFallback = true;
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        // Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        // Bills/Receipts Store
        if (!db.objectStoreNames.contains('bills')) {
          db.createObjectStore('bills', { keyPath: 'id' });
        }
        // Inventory movements logs
        if (!db.objectStoreNames.contains('movements')) {
          db.createObjectStore('movements', { keyPath: 'id' });
        }
        // Alerts
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        // Store configuration
        if (!db.objectStoreNames.contains('storeConfig')) {
          db.createObjectStore('storeConfig', { keyPath: 'key' });
        }
      };
    });
  }

  // Helper helper to get items on fallbacks or real DB
  private performTx<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.useFallback || !this.db) {
        // Run fallback
        resolve(this.fallbackTx<T>(storeName, mode, operation));
        return;
      }

      try {
        const tx = this.db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        if (!store) {
          throw new Error(`Store ${storeName} not found`);
        }
        const req = operation(store);

        req.onsuccess = () => {
          resolve(req.result as T);
        };
        req.onerror = () => {
          reject(req.error);
        };
      } catch (e) {
        console.warn('IndexedDB transaction failed, utilizing LocalStorage instead:', e);
        this.useFallback = true;
        resolve(this.fallbackTx<T>(storeName, mode, operation));
      }
    });
  }

  // LocalStorage Fallback Engine
  private fallbackTx<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: any
  ): any {
    const key = `flexbill_fallback_${storeName}`;
    const rawData = localStorage.getItem(key);
    const list: any[] = rawData ? JSON.parse(rawData) : [];

    // Simulate standard IDB requests based on operation type description in caller
    const callerString = operation.toString();

    // Custom operational interface for localStorage
    return {
      get: (id: string) => {
        if (storeName === 'storeConfig') {
          const found = list.find((item) => item.key === id);
          return found ? found.value : null;
        }
        return list.find((item) => item.id === id) || null;
      },
      getAll: () => {
        if (storeName === 'storeConfig') {
          return list;
        }
        return list;
      },
      put: (item: any) => {
        let newList = [...list];
        const matchKey = storeName === 'storeConfig' ? 'key' : 'id';
        const searchVal = item[matchKey];
        
        const index = newList.findIndex((x) => x[matchKey] === searchVal);
        if (index > -1) {
          newList[index] = item;
        } else {
          newList.push(item);
        }
        localStorage.setItem(key, JSON.stringify(newList));
        return item;
      },
      delete: (id: string) => {
        const matchKey = storeName === 'storeConfig' ? 'key' : 'id';
        const newList = list.filter((item) => item[matchKey] !== id);
        localStorage.setItem(key, JSON.stringify(newList));
        return id;
      },
      clear: () => {
        localStorage.removeItem(key);
        return true;
      }
    };
  }

  // Products CRUD
  async getProducts(): Promise<Product[]> {
    if (this.useFallback) return this.fallbackTx<any>('products', 'readonly', null).getAll();
    return this.performTx<Product[]>('products', 'readonly', (store) => store.getAll());
  }

  async saveProduct(product: Product): Promise<Product> {
    if (this.useFallback) return this.fallbackTx<any>('products', 'readwrite', null).put(product);
    return this.performTx<Product>('products', 'readwrite', (store) => store.put(product));
  }

  async deleteProduct(id: string): Promise<string> {
    if (this.useFallback) return this.fallbackTx<any>('products', 'readwrite', null).delete(id);
    return this.performTx<string>('products', 'readwrite', (store) => store.delete(id));
  }

  // Customers CRUD
  async getCustomers(): Promise<Customer[]> {
    if (this.useFallback) return this.fallbackTx<any>('customers', 'readonly', null).getAll();
    return this.performTx<Customer[]>('customers', 'readonly', (store) => store.getAll());
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    if (this.useFallback) return this.fallbackTx<any>('customers', 'readwrite', null).put(customer);
    return this.performTx<Customer>('customers', 'readwrite', (store) => store.put(customer));
  }

  async deleteCustomer(id: string): Promise<string> {
    if (this.useFallback) return this.fallbackTx<any>('customers', 'readwrite', null).delete(id);
    return this.performTx<string>('customers', 'readwrite', (store) => store.delete(id));
  }

  // Bills CRUD
  async getBills(): Promise<Bill[]> {
    if (this.useFallback) return this.fallbackTx<any>('bills', 'readonly', null).getAll();
    return this.performTx<Bill[]>('bills', 'readonly', (store) => store.getAll());
  }

  async saveBill(bill: Bill): Promise<Bill> {
    if (this.useFallback) return this.fallbackTx<any>('bills', 'readwrite', null).put(bill);
    return this.performTx<Bill>('bills', 'readwrite', (store) => store.put(bill));
  }

  async deleteBill(id: string): Promise<string> {
    if (this.useFallback) return this.fallbackTx<any>('bills', 'readwrite', null).delete(id);
    return this.performTx<string>('bills', 'readwrite', (store) => store.delete(id));
  }

  // Inventory movements
  async getMovements(): Promise<InventoryMovement[]> {
    if (this.useFallback) return this.fallbackTx<any>('movements', 'readonly', null).getAll();
    return this.performTx<InventoryMovement[]>('movements', 'readonly', (store) => store.getAll());
  }

  async saveMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    if (this.useFallback) return this.fallbackTx<any>('movements', 'readwrite', null).put(movement);
    return this.performTx<InventoryMovement>('movements', 'readwrite', (store) => store.put(movement));
  }

  // Notifications
  async getNotifications(): Promise<AlertNotification[]> {
    if (this.useFallback) return this.fallbackTx<any>('notifications', 'readonly', null).getAll();
    return this.performTx<AlertNotification[]>('notifications', 'readonly', (store) => store.getAll());
  }

  async saveNotification(notif: AlertNotification): Promise<AlertNotification> {
    if (this.useFallback) return this.fallbackTx<any>('notifications', 'readwrite', null).put(notif);
    return this.performTx<AlertNotification>('notifications', 'readwrite', (store) => store.put(notif));
  }

  async deleteNotification(id: string): Promise<string> {
    if (this.useFallback) return this.fallbackTx<any>('notifications', 'readwrite', null).delete(id);
    return this.performTx<string>('notifications', 'readwrite', (store) => store.delete(id));
  }

  // Store Configuration CRUD
  async getStoreConfig(): Promise<StoreConfig | null> {
    if (this.useFallback) {
      return this.fallbackTx<any>('storeConfig', 'readonly', null).get('config');
    }
    try {
      const wrapper = await this.performTx<{ key: string; value: StoreConfig }>('storeConfig', 'readonly', (store) => store.get('config'));
      return wrapper ? wrapper.value : null;
    } catch {
      return null;
    }
  }

  async saveStoreConfig(config: StoreConfig): Promise<StoreConfig> {
    if (this.useFallback) {
      this.fallbackTx<any>('storeConfig', 'readwrite', null).put({ key: 'config', value: config });
      return config;
    }
    await this.performTx('storeConfig', 'readwrite', (store) => store.put({ key: 'config', value: config }));
    return config;
  }
}

export const offlineDB = new OfflineDB();
