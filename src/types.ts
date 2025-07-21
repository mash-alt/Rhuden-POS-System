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
  active?: boolean;
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
  active?: boolean;
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
    originalPrice?: number;        // Price before discount
    discountAmount?: number;       // Amount discounted per item
    discountPercent?: number;      // Percentage discount per item
  }>;
  total: number;
  originalTotal?: number;         // Total before any discounts
  subtotal?: number;              // Total before discounts
  discountTotal?: number;         // Total discount amount
  paymentMethod: 'cash' | 'gcash' | 'credit'; // Updated for GCash
  date: Timestamp;
  customerId?: DocumentReference;      // Reference to Customer document
  creditStatus?: 'pending' | 'partial' | 'paid';
  amountPaid?: number;
  dueDate?: Timestamp;
  paymentIds?: string[];              // Array of payment IDs for this sale
  referenceCode?: string;             // Reference code for GCash payments
  
  // COD (Cash on Delivery) specific fields
  isCOD?: boolean;                    // Flag to identify if this is a COD transaction
  deliveryAddress?: string;           // Address where items should be delivered
  deliveryDate?: Timestamp;           // When the delivery is scheduled
}

// Sale creation type (without ID for Firestore)
export type CreateSale = Omit<Sale, 'id'>;

// Payment (for all payment types including credit repayments)
export type Payment = {
  id: string;
  saleId?: DocumentReference;          // Reference to Sale document (optional for credit payments)
  creditAgreementId?: string;          // Reference to Credit Agreement (for credit payments)
  customerId?: DocumentReference;      // Reference to Customer document (optional for cash sales)
  amount: number;
  date: Timestamp;
  paymentMethod: 'cash' | 'gcash' | 'transfer' | 'check';
  paymentType: 'sale' | 'credit_payment'; // Type of payment
  
  // Payment reference tracking
  referenceCode?: string;              // Required for GCash, optional for cash
  receiptNumber?: string;              // Internal receipt/transaction number
  
  // GCash-specific fields
  gcashReferenceNumber?: string;       // GCash transaction reference
  gcashSenderNumber?: string;          // Sender's mobile number (if needed)
  
  // Check-specific fields
  checkNumber?: string;                // Check number (for check payments)
  
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

// Credit Agreement (individual credit record)
export type CreditAgreement = {
  id: string;
  saleId?: DocumentReference;          // Reference to the sale that created this credit
  principalAmount: number;             // Original credit amount
  remainingBalance: number;            // Current outstanding balance
  monthlyPayment: number;              // Fixed monthly payment amount
  totalTerms: number;                  // Total number of payment terms
  remainingTerms: number;              // Remaining payment terms
  startDate: Timestamp;                // When the credit agreement started
  dueDate: Timestamp;                  // When the credit should be fully paid
  nextPaymentDue: Timestamp;           // Next payment due date
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  paymentHistory: string[];            // Array of payment IDs for this credit
  paymentDates?: Timestamp[];          // Array of scheduled payment dates
  notes?: string;
  createdAt: Timestamp;
}

// Credit Agreement creation type (without ID for Firestore)
export type CreateCreditAgreement = Omit<CreditAgreement, 'id'>;

// Customer (with enhanced credit tracking)
export type Customer = {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  creditBalance: number;          // Total outstanding credit across all agreements
  creditAgreements: CreditAgreement[]; // Array of all credit agreements
  //creditScore?: 'excellent' | 'good' | 'fair' | 'poor'; // Credit rating
  joinDate?: Timestamp;
  lastPaymentDate?: Timestamp;
  //notes?: string;
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
// creditAgreements
