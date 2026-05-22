/**
 * FlexBill Zustand Core State Controller
 * @license Apache-2.0
 */

import { create } from 'zustand';
import { AppState, StoreConfig, Product, Customer, Bill, InventoryMovement, AlertNotification, CartItem, UserSession, UserRole } from '../types';
import { offlineDB } from '../services/db';
import { getMockProductsForStore, getMockBillsForStore, MOCK_CUSTOMERS } from '../utils/mockData';

interface AppActions {
  // Navigation & Auth
  setScreen: (screen: AppState['currentScreen']) => void;
  loginUser: (email: string, pin: string) => Promise<boolean>;
  signupUser: (email: string, name: string, pin: string) => Promise<void>;
  setOnboardedConfig: (config: StoreConfig) => Promise<void>;
  logout: () => void;
  
  // App Bootstrapper
  initializeStore: () => Promise<void>;
  
  // Products Management
  addOrUpdateProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  restockProduct: (id: string, amount: number, note?: string) => Promise<void>;
  
  // Customers Management
  addOrUpdateCustomer: (customer: Customer) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
  
  // Billing & Cart
  addToCart: (product: Product, quantity?: number, options?: Partial<CartItem>) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCartDiscount: (amount: number) => void;
  setSelectedTable: (table: string) => void;
  checkoutCart: (paymentMethod: 'cash' | 'card' | 'upi', cashReceived?: number, referenceNo?: string) => Promise<Bill | null>;
  
  // Notifications
  addNotification: (title: string, msg: string, type: AlertNotification['type']) => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  // Search state
  setSearchQuery: (query: string) => void;

  // Theme & Void/Undo & Logo Capture
  toggleDarkMode: () => void;
  voidLastTransaction: () => Promise<boolean>;
  updateStoreConfigLogo: (logoUrl: string) => Promise<void>;
  setAutoOpenAddProductModal: (val: boolean) => void;
}

const initialAuth: UserSession = {
  email: '',
  name: '',
  role: 'cashier',
  storeName: '',
  isLoggedIn: false
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Core Initial State
  currentScreen: 'login',
  storeConfig: null,
  auth: initialAuth,
  products: [],
  customers: [],
  bills: [],
  movements: [],
  notifications: [],
  cart: [],
  selectedCustomer: null,
  selectedTable: 'Table 1',
  cartDiscount: 0,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  searchQuery: '',
  darkMode: false,
  autoOpenAddProductModal: false,

  // Network and Sync
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setScreen: (screen) => set({ currentScreen: screen }),
  setAutoOpenAddProductModal: (val) => set({ autoOpenAddProductModal: val }),

  loginUser: async (email, pin) => {
    // Elegant PIN logic: if a cashier enters, we grant roles, else Admin is default
    const isMockAdmin = email.includes('admin') || email === 'h.subramanyanofficial@gmail.com' || pin === '1234';
    const role: UserRole = isMockAdmin ? 'admin' : 'cashier';
    const name = isMockAdmin ? 'Administrator' : 'Cashier Team';

    const config = get().storeConfig;
    const session: UserSession = {
      email,
      name,
      role,
      storeName: config?.name || 'FlexBill Store',
      isLoggedIn: true
    };

    set({ auth: session });

    // Ensure we send correct view path
    if (config) {
      set({ currentScreen: 'dashboard' });
    } else {
      set({ currentScreen: 'onboard' });
    }
    return true;
  },

  signupUser: async (email, name, pin) => {
    // Generate signup session instantly
    const session: UserSession = {
      email,
      name,
      role: 'admin',
      storeName: 'FlexBill Store',
      isLoggedIn: true
    };
    set({ auth: session, currentScreen: 'onboard' });
  },

  logout: () => {
    set({ auth: initialAuth, currentScreen: 'login', cart: [], selectedCustomer: null });
  },

  setOnboardedConfig: async (config) => {
    // Save Config to DB
    await offlineDB.saveStoreConfig(config);
    
    // Inject tailor-made mock items for the selected type to ensure pristine immediate testing!
    const mockProds = getMockProductsForStore(config.type);
    const mockBills = getMockBillsForStore(config.type, mockProds);
    const mockCusts = MOCK_CUSTOMERS;
    
    // Write seeds to IndexedDB for safety
    for (const p of mockProds) {
      await offlineDB.saveProduct(p);
    }
    for (const c of mockCusts) {
      await offlineDB.saveCustomer(c);
    }
    for (const b of mockBills) {
      await offlineDB.saveBill(b);
    }

    // Dynamic launch notification
    const launchNotif: AlertNotification = {
      id: `N-${Date.now()}`,
      title: `${config.name} Configured!`,
      message: `Welcome to your customized ${config.type.toUpperCase()} billing management workspace.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    };
    await offlineDB.saveNotification(launchNotif);

    set({
      storeConfig: config,
      products: mockProds,
      customers: mockCusts,
      bills: mockBills,
      notifications: [launchNotif],
      currentScreen: 'dashboard'
    });
  },

  initializeStore: async () => {
    try {
      // 1. Load active config
      const config = await offlineDB.getStoreConfig();
      
      // 2. Load lists
      const prods = await offlineDB.getProducts();
      const custs = await offlineDB.getCustomers();
      const bills = await offlineDB.getBills();
      const movements = await offlineDB.getMovements();
      const notifs = await offlineDB.getNotifications();

      // Setup window network state listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => set({ isOnline: true }));
        window.addEventListener('offline', () => set({ isOnline: false }));
      }

      let isDark = false;
      if (typeof window !== 'undefined') {
        isDark = localStorage.getItem('theme_dark') === 'true';
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      }

      set({
        storeConfig: config,
        products: prods,
        customers: custs,
        bills: bills,
        movements: movements,
        notifications: notifs,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        darkMode: isDark
      });

      // Redirect properly if user is logged in
      if (get().auth.isLoggedIn) {
        if (config) {
          set({ currentScreen: 'dashboard' });
        } else {
          set({ currentScreen: 'onboard' });
        }
      }
    } catch (err) {
      console.error('Error during local storage boot initialization: ', err);
    }
  },

  // PRODUCTS
  addOrUpdateProduct: async (product) => {
    await offlineDB.saveProduct(product);
    
    // Trigger notification if stock drops on editing
    let updatedNotifs = [...get().notifications];
    if (product.stock <= product.minStock) {
      const lowStockNotif: AlertNotification = {
        id: `N-${Date.now()}`,
        title: 'Low Stock Flag Alert',
        message: `Product "${product.name}" has reached low stock warning (${product.stock} left).`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false
      };
      await offlineDB.saveNotification(lowStockNotif);
      updatedNotifs.unshift(lowStockNotif);
    }

    set((state) => {
      const filtered = state.products.filter((p) => p.id !== product.id);
      return {
        products: [product, ...filtered],
        notifications: updatedNotifs
      };
    });
  },

  removeProduct: async (id) => {
    await offlineDB.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id)
    }));
  },

  restockProduct: async (id, amount, note = 'Restocked inventory') => {
    const prod = get().products.find((p) => p.id === id);
    if (!prod) return;

    const updated: Product = {
      ...prod,
      stock: prod.stock + amount
    };
    await offlineDB.saveProduct(updated);

    // Save inventory movement log
    const movement: InventoryMovement = {
      id: `M-${Date.now()}`,
      productId: id,
      productName: prod.name,
      changeAmount: amount,
      type: 'restock',
      date: new Date().toISOString(),
      notes: note,
      user: get().auth.name || 'Admin'
    };
    await offlineDB.saveMovement(movement);

    set((state) => ({
      products: state.products.map((p) => p.id === id ? updated : p),
      movements: [movement, ...state.movements]
    }));
  },

  // CUSTOMERS
  addOrUpdateCustomer: async (customer) => {
    await offlineDB.saveCustomer(customer);
    set((state) => {
      const filtered = state.customers.filter((c) => c.id !== customer.id);
      return {
        customers: [customer, ...filtered]
      };
    });
  },

  removeCustomer: async (id) => {
    await offlineDB.deleteCustomer(id);
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id)
    }));
  },

  selectCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  // BILLING / CART ACTIONS
  addToCart: (product, qty = 1, options = {}) => {
    const cart = get().cart;
    const existing = cart.find((item) => item.product.id === product.id);
    
    if (existing) {
      const newQty = existing.quantity + qty;
      // Cap at stock unless stock is simulated unlimited (restaurants)
      const maxAllowed = product.stock;
      if (get().storeConfig?.type !== 'restaurant' && newQty > maxAllowed) {
        get().addNotification('Stock limit notice', `Cannot add more "${product.name}". Max stock reached.`, 'warning');
        return;
      }
      get().updateCartQty(product.id, newQty);
    } else {
      if (get().storeConfig?.type !== 'restaurant' && qty > product.stock) {
        get().addNotification('Out of Stock', `Only ${product.stock} listed for "${product.name}".`, 'warning');
        return;
      }
      const newItem: CartItem = {
        product,
        quantity: qty,
        ...options
      };
      set({ cart: [...cart, newItem] });
    }
  },

  updateCartQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const cart = get().cart;
    const item = cart.find((x) => x.product.id === productId);
    if (!item) return;

    if (get().storeConfig?.type !== 'restaurant' && quantity > item.product.stock) {
      get().addNotification('Insufficient stock', `Only ${item.product.stock} items remaining.`, 'warning');
      return;
    }

    set({
      cart: cart.map((x) => x.product.id === productId ? { ...x, quantity } : x)
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((x) => x.product.id !== productId)
    }));
  },

  clearCart: () => {
    set({ cart: [], selectedCustomer: null, cartDiscount: 0 });
  },

  setCartDiscount: (amount) => {
    set({ cartDiscount: amount });
  },

  setSelectedTable: (table) => {
    set({ selectedTable: table });
  },

  checkoutCart: async (paymentMethod, cashReceived, referenceNo) => {
    const cart = get().cart;
    if (cart.length === 0) return null;

    const config = get().storeConfig;
    if (!config) return null;

    const billsCount = get().bills.length + 1;
    const billTime = new Date();
    
    const billId = `B-${billTime.getTime()}-${Math.floor(100 + Math.random() * 900)}`;
    const billNo = `FLX-${billTime.getFullYear()}${(billTime.getMonth() + 1).toString().padStart(2, '0')}${billTime.getDate().toString().padStart(2, '0')}-${billsCount.toString().padStart(4, '0')}`;

    // Compute bill items
    const items = cart.map((item) => {
      const unitPrice = item.customPrice ?? item.product.price;
      const totalRaw = unitPrice * item.quantity;
      const taxRate = item.product.taxRate;
      
      // Reverse tax calculations
      const taxAmount = totalRaw - (totalRaw / (1 + taxRate / 100));

      return {
        productId: item.product.id,
        name: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        taxRate: taxRate,
        taxAmount: Number(taxAmount.toFixed(2)),
        total: Number(totalRaw.toFixed(2)),
        unit: item.product.unit,
        variantSize: item.variantSize,
        variantColor: item.variantColor
      };
    });

    const subtotalRaw = items.reduce((acc, x) => acc + x.total, 0);
    const taxSum = items.reduce((acc, x) => acc + x.taxAmount, 0);
    const discount = get().cartDiscount;
    const grandTotal = Math.max(0, Number((subtotalRaw - discount).toFixed(2)));

    const changeReturned = cashReceived ? Math.max(0, Number((cashReceived - grandTotal).toFixed(2))) : undefined;

    const activeCust = get().selectedCustomer;
    
    const newBill: Bill = {
      id: billId,
      billNo,
      date: billTime.toISOString(),
      customerName: activeCust?.name,
      customerPhone: activeCust?.phone,
      items,
      subtotal: Number((subtotalRaw - taxSum).toFixed(2)),
      taxTotal: Number(taxSum.toFixed(2)),
      discountTotal: discount,
      grandTotal,
      paymentMethod,
      paymentStatus: 'paid',
      cashReceived,
      changeReturned,
      referenceNo: referenceNo || (paymentMethod !== 'cash' ? `TXN${Math.floor(1e8 + Math.random() * 9e7)}` : undefined),
      storeType: config.type,
      tableNo: config.type === 'restaurant' ? get().selectedTable : undefined,
      synced: get().isOnline
    };

    // 1. Reduce stocks and log database movements natively
    const updatedProducts = [...get().products];
    const movementLogs: InventoryMovement[] = [];

    for (const item of cart) {
      if (config.type === 'restaurant') continue; // Restaurants typically have infinite ingredients listed as menu prods

      const idx = updatedProducts.findIndex((p) => p.id === item.product.id);
      if (idx > -1) {
        const p = updatedProducts[idx];
        const updatedStock = Math.max(0, Number((p.stock - item.quantity).toFixed(2)));
        
        updatedProducts[idx] = {
          ...p,
          stock: updatedStock
        };

        // Write to IndexedDB
        await offlineDB.saveProduct(updatedProducts[idx]);

        // Inventory movements record log
        const move: InventoryMovement = {
          id: `M-${Date.now()}-${idx}`,
          productId: p.id,
          productName: p.name,
          changeAmount: -item.quantity,
          type: 'sale',
          date: billTime.toISOString(),
          notes: `POS checkout ${billNo}`,
          user: get().auth.name || 'POS Cashier'
        };
        await offlineDB.saveMovement(move);
        movementLogs.unshift(move);

        // Low stock checker trigger
        if (updatedStock <= p.minStock) {
          await get().addNotification(
            'Critically Low Stock Warning',
            `Product "${p.name}" has only ${updatedStock} units left. Please order restock.`,
            'warning'
          );
        }
      }
    }

    // 2. Loyalty updates for customers
    const updatedCustomers = [...get().customers];
    if (activeCust) {
      const cIdx = updatedCustomers.findIndex((c) => c.id === activeCust.id);
      if (cIdx > -1) {
        const pointsAdded = Math.floor(grandTotal / 100); // 1 point per 100 Rs spend
        const updatedC: Customer = {
          ...activeCust,
          loyaltyPoints: activeCust.loyaltyPoints + pointsAdded,
          totalSpent: activeCust.totalSpent + grandTotal,
          lastVisit: billTime.toISOString().split('T')[0]
        };
        updatedCustomers[cIdx] = updatedC;
        await offlineDB.saveCustomer(updatedC);
      }
    }

    // 3. Save Receipt to LocalDB
    await offlineDB.saveBill(newBill);

    get().addNotification(
      'Sale Booked Successfully',
      `Invoice #${billNo} of ₹${grandTotal} generated.`,
      'success'
    );

    set((state) => ({
      bills: [newBill, ...state.bills],
      products: updatedProducts,
      movements: [...movementLogs, ...state.movements],
      customers: updatedCustomers,
      cart: [],
      selectedCustomer: null,
      cartDiscount: 0
    }));

    return newBill;
  },

  // NOTIFICATION ACTIONS
  addNotification: async (title, msg, type) => {
    const notif: AlertNotification = {
      id: `N-${Date.now()}-${Math.floor(Math.random()*100)}`,
      title,
      message: msg,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    await offlineDB.saveNotification(notif);
    set((state) => ({
      notifications: [notif, ...state.notifications]
    }));
  },

  readNotification: async (id) => {
    const notifs = get().notifications;
    const target = notifs.find((n) => n.id === id);
    if (!target) return;

    const updated = { ...target, read: true };
    await offlineDB.saveNotification(updated);

    set({
      notifications: notifs.map((n) => n.id === id ? updated : n)
    });
  },

  clearNotifications: async () => {
    const notifs = get().notifications;
    for (const n of notifs) {
      await offlineDB.deleteNotification(n.id);
    }
    set({ notifications: [] });
  },

  toggleDarkMode: () => {
    const nextDark = !get().darkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_dark', String(nextDark));
      if (nextDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
    set({ darkMode: nextDark });
  },

  voidLastTransaction: async () => {
    const bills = get().bills;
    if (bills.length === 0) return false;
    // The most recent bill is at index 0 because we prepend new ones
    const lastBill = bills[0];

    try {
      // 1. Return items to stock
      const updatedProducts = [...get().products];
      const movementLogs: InventoryMovement[] = [];
      const nowStr = new Date().toISOString();

      for (const item of lastBill.items) {
        const idx = updatedProducts.findIndex((p) => p.id === item.productId);
        if (idx > -1) {
          const p = updatedProducts[idx];
          // Restore stock
          const restoredStock = Number((p.stock + item.quantity).toFixed(2));
          updatedProducts[idx] = {
            ...p,
            stock: restoredStock
          };
          await offlineDB.saveProduct(updatedProducts[idx]);

          // Log movement
          const move: InventoryMovement = {
            id: `M-${Date.now()}-${idx}-void`,
            productId: p.id,
            productName: p.name,
            changeAmount: item.quantity,
            type: 'restock',
            date: nowStr,
            notes: `Voided Invoice ${lastBill.billNo}`,
            user: get().auth.name || 'Admin POS'
          };
          await offlineDB.saveMovement(move);
          movementLogs.unshift(move);
        }
      }

      // 2. Revert customer loyalty points and total spend
      const updatedCustomers = [...get().customers];
      if (lastBill.customerPhone) {
        const cIdx = updatedCustomers.findIndex((c) => c.phone === lastBill.customerPhone);
        if (cIdx > -1) {
          const cust = updatedCustomers[cIdx];
          const pointsToSubtract = Math.floor(lastBill.grandTotal / 100);
          updatedCustomers[cIdx] = {
            ...cust,
            loyaltyPoints: Math.max(0, cust.loyaltyPoints - pointsToSubtract),
            totalSpent: Math.max(0, cust.totalSpent - lastBill.grandTotal)
          };
          await offlineDB.saveCustomer(updatedCustomers[cIdx]);
        }
      }

      // 3. Delete the bill from offline DB
      await offlineDB.deleteBill(lastBill.id);

      get().addNotification(
        'Transaction Voided Successfully',
        `Invoice #${lastBill.billNo} of ${lastBill.grandTotal} was voided & items returned to inventory stock.`,
        'error' // 'error' highlights the warning in red color
      );

      set((state) => ({
        bills: state.bills.filter((b) => b.id !== lastBill.id),
        products: updatedProducts,
        customers: updatedCustomers,
        movements: [...movementLogs, ...state.movements]
      }));

      return true;
    } catch (err) {
      console.error('Error voiding transaction:', err);
      return false;
    }
  },

  updateStoreConfigLogo: async (logoUrl: string) => {
    const config = get().storeConfig;
    if (!config) return;

    const updatedConfig = {
      ...config,
      logoUrl
    };

    await offlineDB.saveStoreConfig(updatedConfig);
    set({ storeConfig: updatedConfig });

    get().addNotification(
      'Receipt Logo Updated',
      'The company logo has been successfully captured and updated for printed receipts.',
      'success'
    );
  }
}));
