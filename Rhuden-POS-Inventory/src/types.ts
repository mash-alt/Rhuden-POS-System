import { Timestamp, DocumentReference } from 'firebase/firestore';

// Product
export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost?: number;
  description?: string;
  categoryId: string;    // Category document ID
  supplierId: string;    // Supplier document ID
  stockQuantity?: number;
  reorderLevel?: number;
  unit?: string;
  active?: boolean;
  createdAt?: Timestamp;
}

// Product creation type (without ID for Firestore)
export type CreateProduct = Omit<Product, 'id'>;

// Category
export type Category = {
  id: string;
  name: string;
  description?: string;
}

// Category creation type (without ID for Firestore)
export type CreateCategory = Omit<Category, 'id'>;

// Supplier
export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// Supplier creation type (without ID for Firestore)
export type CreateSupplier = Omit<Supplier, 'id'>;

// Inventory
export type Inventory = {
  id: string;
  productId: string;    // Product document ID
  quantity: number;
}

// Inventory creation type (without ID for Firestore)
export type CreateInventory = Omit<Inventory, 'id'>;

// Sale (POS Transaction, supports credit sales)
export type Sale = {
  id: string;
  items: Array<{
    productId: DocumentReference;    // Reference to Product document
    qty: number;
    price: number;
  }>;
  total: number;
  paymentMethod: 'cash' | 'gcash' | 'credit'; // Updated for GCash
  date: Timestamp;
  customerId?: DocumentReference;      // Reference to Customer document
  creditStatus?: 'pending' | 'partial' | 'paid';
  amountPaid?: number;
  dueDate?: Timestamp;
  paymentIds?: string[];              // Array of payment IDs for this sale
}

// Sale creation type (without ID for Firestore)
export type CreateSale = Omit<Sale, 'id'>;

// Payment (for all payment types including credit repayments)
export type Payment = {
  id: string;
  saleId: DocumentReference;        // Reference to Sale document
  customerId?: DocumentReference;   // Reference to Customer document (optional for cash sales)
  amount: number;
  date: Timestamp;
  paymentMethod: 'cash' | 'gcash' | 'transfer' | 'check';
  
  // Payment reference tracking
  referenceCode?: string;           // Required for GCash, optional for cash
  receiptNumber?: string;           // Internal receipt/transaction number
  
  // GCash-specific fields
  gcashReferenceNumber?: string;    // GCash transaction reference
  gcashSenderNumber?: string;       // Sender's mobile number (if needed)
  
  // Check-specific fields
  checkNumber?: string;             // Check number (for check payments)
  
  notes?: string;
}

// Payment creation type (without ID for Firestore)
export type CreatePayment = Omit<Payment, 'id'>;

// User
export type User = {
  id: string;
  uid: string;      // Firebase Auth user ID
  name: string;
  role: 'staff' | 'admin'; // User role
  email: string;
}

// User creation type (without ID for Firestore)
export type CreateUser = Omit<User, 'id'>;

// Customer (with credit tracking)
export type Customer = {
  id: string;
  name: string;
  contact?: string;
  creditBalance?: number;  // Outstanding credit
}

// Customer creation type (without ID for Firestore)
export type CreateCustomer = Omit<Customer, 'id'>;

// Stock Movement (for tracking stock ins and outs)
export type StockMovement = {
  id: string;
  productId: DocumentReference;    // Reference to Product document
  type: 'in' | 'out';             // Stock in or stock out
  quantity: number;               // Quantity moved (positive for both in/out)
  reason: 'purchase' | 'sale' | 'adjustment' | 'damage' | 'return' | 'transfer';
  reference?: string;             // Reference number (PO, invoice, etc.)
  notes?: string;                 // Additional notes
  date: Timestamp;                // When the movement occurred
  userId: DocumentReference;      // Reference to User who performed the action
  previousStock?: number;         // Stock level before this movement
  newStock?: number;              // Stock level after this movement
}

// Stock Movement creation type (without ID for Firestore)
export type CreateStockMovement = Omit<StockMovement, 'id'>;

//document names for Firestore collections:
// products
// categories
// suppliers
// inventory
// sales
// payments
// users
// customers
// stockMovements
