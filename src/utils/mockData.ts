/**
 * FlexBill Custom Multi-Store Seed Data Generator
 * @license Apache-2.0
 */

import { Product, Customer, Bill, InventoryMovement, StoreType, AlertNotification } from '../types';

export const STORE_TYPES_DETAILS = [
  { id: 'grocery', label: 'Grocery & Supermarket', icon: 'ShoppingCart', desc: 'Weight-based billing, batches, staples, and fresh stock' },
  { id: 'pharmacy', label: 'Pharmacy & Wellness', icon: 'Pill', desc: 'Expiry-date alerts, batch tracking, prescription receipts' },
  { id: 'restaurant', label: 'Restaurant & Bakery', icon: 'Utensils', desc: 'Table layout management, Veg/Non-veg badges, Kitchen orders (KOT)' },
  { id: 'clothing', label: 'Clothing & Apparel', icon: 'Shirt', desc: 'Size, color variants, barcode searches, fashion items' },
  { id: 'electronics', label: 'Electronics & Mobile', icon: 'Laptop', desc: 'Serial tracking, high-value SKUs, warranty details' },
  { id: 'custom', label: 'General Retail Store', icon: 'Store', desc: 'Customizable categories, general pricing, simple POS setups' }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Arjun Sharma', phone: '9876543210', email: 'arjun.s@gmail.com', loyaltyPoints: 420, totalSpent: 9850, notes: 'Premium client, prefers quick delivery' },
  { id: 'c2', name: 'Priya Patel', phone: '8765432109', email: 'priya09@yahoo.com', loyaltyPoints: 180, totalSpent: 4320, notes: 'Regular weekend shopper' },
  { id: 'c3', name: 'Rohan Verma', phone: '7654321098', email: 'rohan.v@gmail.com', loyaltyPoints: 65, totalSpent: 1850 },
  { id: 'c4', name: 'Ananya Iyer', phone: '9123456780', email: 'ananya.iyer@outlook.com', loyaltyPoints: 740, totalSpent: 16500, notes: 'Asks for digital invoices only' },
  { id: 'c5', name: 'Amit Gupta', phone: '9812736450', email: 'amit.gupta@corp.com', loyaltyPoints: 0, totalSpent: 750 }
];

// Returns mock products depending on store type
export function getMockProductsForStore(type: StoreType): Product[] {
  const now = new Date();
  
  // Format expiry dates relative to current date (e.g. +6 months)
  const getFutureDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const getRandomSKU = (prefix: string) => {
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  switch (type) {
    case 'grocery':
      return [
        { id: 'g1', name: 'Premium Basmati Rice', sku: getRandomSKU('GRC'), barcode: '8901058002315', category: 'Staples', price: 110, costPrice: 85, stock: 250, minStock: 25, unit: 'kg', taxRate: 5, isSellByWeight: true },
        { id: 'g2', name: 'Fresh Organic Tomatoes', sku: getRandomSKU('FRU'), barcode: '8901058002316', category: 'Fruits & Veg', price: 40, costPrice: 22, stock: 80, minStock: 15, unit: 'kg', taxRate: 0, isSellByWeight: true },
        { id: 'g3', name: 'Double Toned Milk 1L', sku: getRandomSKU('DYR'), barcode: '8901058002317', category: 'Dairy', price: 62, costPrice: 54, stock: 120, minStock: 30, unit: 'pcs', taxRate: 0 },
        { id: 'g4', name: 'Refined Sunflower Oil 1L', sku: getRandomSKU('GRC'), barcode: '8901058002318', category: 'Staples', price: 145, costPrice: 125, stock: 95, minStock: 15, unit: 'pcs', taxRate: 5 },
        { id: 'g5', name: 'Whole Wheat Bread', sku: getRandomSKU('BKR'), barcode: '8901058002319', category: 'Bakery', price: 45, costPrice: 35, stock: 14, minStock: 15, unit: 'pcs', taxRate: 0 }, // low stock
        { id: 'g6', name: 'Sujata Gold Atta 5kg', sku: getRandomSKU('GRC'), barcode: '8901058002320', category: 'Staples', price: 290, costPrice: 245, stock: 110, minStock: 10, unit: 'pcs', taxRate: 5 },
        { id: 'g7', name: 'Alphonso Mangoes', sku: getRandomSKU('FRU'), barcode: '8901058002321', category: 'Fruits & Veg', price: 180, costPrice: 120, stock: 65, minStock: 10, unit: 'kg', taxRate: 0, isSellByWeight: true },
        { id: 'g8', name: 'Spiced Potato Chips 100g', sku: getRandomSKU('SNK'), barcode: '8901058002322', category: 'Snacks & Drinks', price: 30, costPrice: 20, stock: 240, minStock: 20, unit: 'pcs', taxRate: 18 }
      ];

    case 'pharmacy':
      return [
        { id: 'p1', name: 'Paracetamol 650mg (Dolo)', sku: getRandomSKU('MED'), barcode: '8901058004111', category: 'Analgesics', price: 30, costPrice: 18, stock: 450, minStock: 50, unit: 'strip', taxRate: 12, expiryDate: getFutureDate(18), batchNumber: 'B-DL921' },
        { id: 'p2', name: 'Amoxicillin 500mg (Antibiotic)', sku: getRandomSKU('MED'), barcode: '8901058004112', category: 'Antibiotics', price: 118, costPrice: 80, stock: 120, minStock: 20, unit: 'strip', taxRate: 12, expiryDate: getFutureDate(8), batchNumber: 'B-AM204' },
        { id: 'p3', name: 'Cetirizine 10mg Allergy relief', sku: getRandomSKU('MED'), barcode: '8901058004113', category: 'Antihistamines', price: 25, costPrice: 12, stock: 8, minStock: 15, unit: 'strip', taxRate: 12, expiryDate: getFutureDate(24), batchNumber: 'B-CZ081' }, // Low Stock
        { id: 'p4', name: 'Cough Syrup Honey Base', sku: getRandomSKU('MED'), barcode: '8901058004114', category: 'Syrpus', price: 95, costPrice: 65, stock: 65, minStock: 10, unit: 'bottle', taxRate: 12, expiryDate: getFutureDate(4), batchNumber: 'B-CS552' },
        { id: 'p5', name: 'Multi-Vitamin Capsules (30s)', sku: getRandomSKU('NUT'), barcode: '8901058004115', category: 'Nutraceuticals', price: 340, costPrice: 220, stock: 80, minStock: 12, unit: 'bottle', taxRate: 18, expiryDate: getFutureDate(12), batchNumber: 'B-VT331' },
        { id: 'p6', name: 'Digital Blood Pressure Monitor', sku: getRandomSKU('EQP'), barcode: '8901058004116', category: 'Devices', price: 1850, costPrice: 1300, stock: 22, minStock: 5, unit: 'pcs', taxRate: 18, expiryDate: undefined, batchNumber: 'SN-77810A' },
        { id: 'p7', name: 'N95 Protective Face Masks (5 Pack)', sku: getRandomSKU('EQP'), barcode: '8901058004117', category: 'Consumables', price: 250, costPrice: 140, stock: 150, minStock: 20, unit: 'pack', taxRate: 5, expiryDate: getFutureDate(36), batchNumber: 'B-MS403' },
        { id: 'p8', name: 'Aspirin Cardio 75mg', sku: getRandomSKU('MED'), barcode: '8901058004118', category: 'Cardiology', price: 45, costPrice: 28, stock: 0, minStock: 20, unit: 'strip', taxRate: 12, expiryDate: getFutureDate(1), batchNumber: 'B-AS903' } // Out of stock & Critical Expiry
      ];

    case 'restaurant':
      return [
        { id: 'r1', name: 'Farmhouse Cheese Pizza (12")', sku: getRandomSKU('FOD'), barcode: '8901058005111', category: 'Pizzas', price: 380, costPrice: 190, stock: 999, minStock: 0, unit: 'pcs', taxRate: 18, isVeg: true },
        { id: 'r2', name: 'Spicy Paneer Tikka Wrap', sku: getRandomSKU('FOD'), barcode: '8901058005112', category: 'Wraps & Starters', price: 180, costPrice: 90, stock: 999, minStock: 0, unit: 'pcs', taxRate: 18, isVeg: true },
        { id: 'r3', name: 'Double Chicken Cheese Burger', sku: getRandomSKU('FOD'), barcode: '8901058005113', category: 'Burgers', price: 220, costPrice: 110, stock: 999, minStock: 0, unit: 'pcs', taxRate: 18, isVeg: false },
        { id: 'r4', name: 'Garlic Breadsticks with Dip', sku: getRandomSKU('FOD'), barcode: '8901058005114', category: 'Sides', price: 120, costPrice: 50, stock: 999, minStock: 0, unit: 'pcs', taxRate: 18, isVeg: true },
        { id: 'r5', name: 'Fudge Chocolate Brownie', sku: getRandomSKU('DES'), barcode: '8901058005115', category: 'Desserts', price: 140, costPrice: 65, stock: 45, minStock: 5, unit: 'pcs', taxRate: 18, isVeg: true },
        { id: 'r6', name: 'Fresh Mint Lime Mojito', sku: getRandomSKU('BRV'), barcode: '8901058005116', category: 'Drinks', price: 95, costPrice: 30, stock: 999, minStock: 0, unit: 'pcs', taxRate: 18, isVeg: true },
        { id: 'r7', name: 'Cappuccino Custom Brew', sku: getRandomSKU('BRV'), barcode: '8901058005117', category: 'Drinks', price: 110, costPrice: 40, stock: 999, minStock: 0, unit: 'pcs', taxRate: 18, isVeg: true }
      ];

    case 'clothing':
      return [
        { id: 'c1', name: 'Premium Slim-Fit Polo Crew', sku: getRandomSKU('APP'), barcode: '8901058006111', category: 'Menswear', price: 899, costPrice: 420, stock: 85, minStock: 10, unit: 'pcs', taxRate: 12, size: 'M', color: 'Navy Blue' },
        { id: 'c2', name: 'Stretchable Canvas Denim Jeans', sku: getRandomSKU('APP'), barcode: '8901058006112', category: 'Menswear', price: 1499, costPrice: 680, stock: 48, minStock: 8, unit: 'pcs', taxRate: 12, size: '32', color: 'Charcoal Grey' },
        { id: 'c3', name: 'Classic Floral Summer Dress', sku: getRandomSKU('APP'), barcode: '8901058006113', category: 'Womenswear', price: 1250, costPrice: 550, stock: 32, minStock: 5, unit: 'pcs', taxRate: 12, size: 'S', color: 'Soft Coral' },
        { id: 'c4', name: 'Padded Comfort Sports Tee', sku: getRandomSKU('APP'), barcode: '8901058006114', category: 'Kidswear', price: 499, costPrice: 210, stock: 4, minStock: 10, unit: 'pcs', taxRate: 5, size: 'L', color: 'Fluorescent Green' }, // Low stock
        { id: 'c5', name: 'Casual Linen Full-Sleeves Shirt', sku: getRandomSKU('APP'), barcode: '8901058006115', category: 'Menswear', price: 1100, costPrice: 500, stock: 42, minStock: 6, unit: 'pcs', taxRate: 12, size: 'L', color: 'Pastel White' },
        { id: 'c6', name: 'Unisex Knit Winter Hoodie', sku: getRandomSKU('APP'), barcode: '8901058006116', category: 'Winterwear', price: 1999, costPrice: 920, stock: 25, minStock: 5, unit: 'pcs', taxRate: 12, size: 'XL', color: 'Sunset Yellow' }
      ];

    case 'electronics':
      return [
        { id: 'e1', name: 'Pro-Audio Wireless Earbuds IX9', sku: getRandomSKU('ELC'), barcode: '8901058007111', category: 'Audio', price: 2499, costPrice: 1450, stock: 65, minStock: 8, unit: 'pcs', taxRate: 18 },
        { id: 'e2', name: 'NeoFit GPS Health Band v4', sku: getRandomSKU('ELC'), barcode: '8901058007112', category: 'Wearables', price: 3499, costPrice: 2100, stock: 24, minStock: 5, unit: 'pcs', taxRate: 18 },
        { id: 'e3', name: 'SuperFast 33W Fast Charger Hub', sku: getRandomSKU('ELC'), barcode: '8901058007113', category: 'Accessories', price: 850, costPrice: 420, stock: 90, minStock: 15, unit: 'pcs', taxRate: 18 },
        { id: 'e4', name: 'Quantum Core Mechanical Keyboard', sku: getRandomSKU('ELC'), barcode: '8901058007114', category: 'Peripherals', price: 4200, costPrice: 2600, stock: 12, minStock: 3, unit: 'pcs', taxRate: 18 },
        { id: 'e5', name: 'Dual Band WiFi-6 Router Pro', sku: getRandomSKU('ELC'), barcode: '8901058007115', category: 'Networking', price: 2950, costPrice: 1900, stock: 2, minStock: 5, unit: 'pcs', taxRate: 18 }, // Low stock
        { id: 'e6', name: 'Ultra-Slim Type-C Powerbank 10k', sku: getRandomSKU('ELC'), barcode: '8901058007116', category: 'Accessories', price: 1200, costPrice: 750, stock: 45, minStock: 10, unit: 'pcs', taxRate: 18 }
      ];

    default:
      return [
        { id: 'u1', name: 'Hardened Steel Combination Lock', sku: getRandomSKU('GEN'), barcode: '8901058008111', category: 'Hardware', price: 320, costPrice: 210, stock: 45, minStock: 5, unit: 'pcs', taxRate: 18 },
        { id: 'u2', name: 'Universal Heavy Duty Extension Strip', sku: getRandomSKU('GEN'), barcode: '8901058008112', category: 'Electrical', price: 450, costPrice: 310, stock: 18, minStock: 4, unit: 'pcs', taxRate: 18 },
        { id: 'u3', name: 'Compact LED Rechargeable Torch', sku: getRandomSKU('GEN'), barcode: '8901058008113', category: 'Utility', price: 220, costPrice: 130, stock: 3, minStock: 10, unit: 'pcs', taxRate: 12 }, // Low stock
        { id: 'u4', name: 'Microfiber Multiuse Cleaning Towels', sku: getRandomSKU('GEN'), barcode: '8901058008114', category: 'Household', price: 180, costPrice: 90, stock: 120, minStock: 20, unit: 'pcs', taxRate: 5 }
      ];
  }
}

// Generates real transactions based on store configuration
export function getMockBillsForStore(type: StoreType, products: Product[]): Bill[] {
  if (products.length === 0) return [];
  
  const bills: Bill[] = [];
  const daysOfMockData = 7;
  // Get random customers
  const p1 = MOCK_CUSTOMERS[0];
  const p2 = MOCK_CUSTOMERS[1];
  const p3 = MOCK_CUSTOMERS[2];

  for (let i = daysOfMockData; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Set realistic time of day
    date.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 59));

    // Generate 2-4 transactions per day
    const transactionsCount = 2 + Math.floor(Math.random() * 3);
    
    for (let t = 0; t < transactionsCount; t++) {
      const billTime = new Date(date);
      billTime.setMinutes(t * 75 + Math.floor(Math.random() * 40));

      const billId = `B-${billTime.getTime()}-${Math.floor(100+Math.random()*900)}`;
      const billNo = `FLX-${billTime.getFullYear()}${(billTime.getMonth()+1).toString().padStart(2,'0')}${billTime.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const cartProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 3));
      
      const items = cartProducts.map((p) => {
        const qty = p.isSellByWeight ? Number((0.5 + Math.random() * 2).toFixed(2)) : (1 + Math.floor(Math.random() * 2));
        const sub = p.price * qty;
        const taxRate = p.taxRate;
        const tax = sub - (sub / (1 + taxRate / 100));
        
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: qty,
          taxRate: taxRate,
          taxAmount: Number(tax.toFixed(2)),
          total: Number(sub.toFixed(2)),
          unit: p.unit
        };
      });

      const subtotalRaw = items.reduce((acc, x) => acc + x.total, 0);
      const taxSum = items.reduce((acc, x) => acc + x.taxAmount, 0);
      const discount = Math.random() > 0.6 ? (Math.random() > 0.5 ? 50 : 100) : 0;
      
      const grandTotal = Math.max(0, Number((subtotalRaw - discount).toFixed(2)));
      
      const methods: ('cash'|'card'|'upi')[] = ['cash', 'card', 'upi'];
      const paymentMethod = methods[Math.floor(Math.random() * 3)];
      
      const cust = Math.random() > 0.3 ? MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)] : null;
      
      bills.push({
        id: billId,
        billNo,
        date: billTime.toISOString(),
        customerName: cust?.name,
        customerPhone: cust?.phone,
        items,
        subtotal: Number((subtotalRaw - taxSum).toFixed(2)),
        taxTotal: Number(taxSum.toFixed(2)),
        discountTotal: discount,
        grandTotal,
        paymentMethod,
        paymentStatus: 'paid',
        cashReceived: paymentMethod === 'cash' ? Math.ceil(grandTotal / 100) * 100 : undefined,
        changeReturned: paymentMethod === 'cash' ? (Math.ceil(grandTotal / 100) * 100) - grandTotal : undefined,
        referenceNo: paymentMethod !== 'cash' ? `TXN${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
        storeType: type,
        tableNo: type === 'restaurant' ? `Table ${1 + Math.floor(Math.random() * 12)}` : undefined,
        synced: true
      });
    }
  }

  return bills;
}

// Generate reports analytics data
export function getChartAnalytics(bills: Bill[]) {
  const result: { [key: string]: { date: string; Sales: number; Orders: number; GstCollected: number } } = {};
  
  // Group by date
  bills.forEach((b) => {
    const dt = new Date(b.date);
    const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!result[dateStr]) {
      result[dateStr] = { date: dateStr, Sales: 0, Orders: 0, GstCollected: 0 };
    }
    result[dateStr].Sales += b.grandTotal;
    result[dateStr].Orders += 1;
    result[dateStr].GstCollected += b.taxTotal;
  });

  // Convert to array and round values
  return Object.values(result).map((x) => ({
    ...x,
    Sales: Number(x.Sales.toFixed(2)),
    GstCollected: Number(x.GstCollected.toFixed(2))
  }));
}
