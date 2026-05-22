/**
 * FlexBill Shared Types and Domain Definitions
 * @license Apache-2.0
 */

export type StoreType = 'grocery' | 'pharmacy' | 'restaurant' | 'clothing' | 'electronics' | 'custom';

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface StoreConfig {
  name: string;
  type: StoreType;
  ownerName: string;
  phone: string;
  address: string;
  gstin: string;
  currency: string;
  currencySymbol: string;
  defaultTaxRate: number; // default GST% e.g. 18
  invoiceFooter: string;
  enableThermalMock: boolean;
  logoUrl?: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  storeName: string;
  isLoggedIn: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number; // low-stock trigger
  unit: string; // 'pcs', 'kg', 'g', 'pack', 'bottle', 'strip'
  taxRate: number; // e.g. 18 for 18%
  imageUrl?: string;
  
  // Dynamic business sector properties
  expiryDate?: string;      // Pharmacy (Format: YYYY-MM-DD)
  batchNumber?: string;     // Pharmacy / Grocery batching
  size?: string;            // Clothing (e.g. S, M, L, XL)
  color?: string;           // Clothing (e.g. Red, Blue, Black)
  isVeg?: boolean;          // Restaurant
  isSellByWeight?: boolean; // Grocery (calculates price using float weights)
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  variantSize?: string;
  variantColor?: string;
  restaurantTable?: string;
  kitchenInstructions?: string;
}

export interface BillItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  unit: string;
  variantSize?: string;
  variantColor?: string;
}

export interface Bill {
  id: string;
  billNo: string;
  date: string; // ISO String
  customerPhone?: string;
  customerName?: string;
  items: BillItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'split';
  paymentStatus: 'paid' | 'pending' | 'due';
  cashReceived?: number;
  changeReturned?: number;
  referenceNo?: string; // QR UPI transaction ID or Card transaction ID
  storeType: StoreType;
  tableNo?: string; // Restaurant table
  isKOTSent?: boolean; // Kitchen Order Ticket
  synced: boolean; // Sync status flag
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  changeAmount: number; // e.g., -5 for sale, +10 for restocking
  type: 'sale' | 'restock' | 'adjustment' | 'damage';
  date: string;
  notes?: string;
  user: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface AppState {
  currentScreen: 'login' | 'signup' | 'forgot' | 'onboard' | 'dashboard' | 'pos' | 'products' | 'customers' | 'inventory' | 'reports' | 'settings';
  storeConfig: StoreConfig | null;
  auth: UserSession;
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  movements: InventoryMovement[];
  notifications: AlertNotification[];
  cart: CartItem[];
  selectedCustomer: Customer | null;
  selectedTable: string; // Restaurant
  cartDiscount: number; // static amount
  isOnline: boolean;
  searchQuery: string;
  darkMode: boolean;
  autoOpenAddProductModal?: boolean;
}
