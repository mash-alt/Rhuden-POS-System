import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, Timestamp, collection, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import useProducts from "../hooks/useProducts";
import useCustomers from "../hooks/useCustomers";
import useSales from "../hooks/useSales";
import { usePayments } from "../hooks/usePayments";
import type { Product, Customer, Sale, CreditAgreement, CreateCreditAgreement } from "../types";
import ReceiptModal from "../components/ReceiptModal";
import "../styles/POS.css";

// Additional inline styles for credit form
const creditFormStyles = `
  .credit-options {
    border: none;
    background-color: #f8fafc;
    padding: 12px;
    margin: 12px 0;
    border-radius: 8px;
    animation: fadeIn 0.3s ease-in-out;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .credit-options h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #334155;
    font-size: 14px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    font-weight: 500;
  }
  
  .credit-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .credit-options .form-group {
    margin-bottom: 8px;
  }
  
  /* Payment Timeline Styles */
  .payment-timeline {
    margin-top: 15px;
    border-top: 1px dashed #ddd;
    padding-top: 10px;
  }
  
  .payment-timeline h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 14px;
  }
  
  .timeline-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
    padding: 4px 0;
  }
  
  .timeline-item {
    background-color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 8px;
    width: calc(33.33% - 6px);
    box-sizing: border-box;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  
  .timeline-date {
    font-weight: 500;
    font-size: 11px;
    color: #334155;
  }
  
  .timeline-amount {
    font-size: 11px;
    color: #0f766e;
    margin-top: 2px;
    font-weight: 500;
  }
  
  .timeline-payment-number {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }
  
  .timeline-status .status-upcoming {
    color: #0891b2;
    background-color: #e0f2fe;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 9px;
    display: inline-block;
  }
  
  .timeline-status .status-pending {
    color: #64748b;
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 9px;
    display: inline-block;
  }
  
  .timeline-status .status-paid {
    color: #16a34a;
    background-color: #dcfce7;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 9px;
    display: inline-block;
  }
  
  .credit-options input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
  }
  
  .credit-summary {
    background-color: #f8fafc;
    padding: 12px;
    margin: 12px 0;
    border-radius: 6px;
    border-left: 3px solid #0ea5e9;
    margin-top: 16px;
  }
  
  .summary-header {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 8px;
    color: #0369a1;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  
  .credit-summary p {
    margin: 3px 0;
    font-size: 12px;
  }
  
  .credit-warning {
    color: #dc2626;
    font-weight: 500;
    margin-top: 8px;
    font-size: 11px;
  }
  
  .credit-info {
    color: #0369a1;
    font-style: italic;
    margin-top: 4px;
    font-size: 11px;
  }
  
  /* Responsive styles for smaller screens */
  @media (max-width: 768px) {
    .credit-form {
      grid-template-columns: 1fr;
    }
    
    .timeline-item {
      width: calc(50% - 8px);
    }
  }
  
  @media (max-width: 480px) {
    .timeline-item {
      width: 100%;
    }
  }
  
  /* Credit Payment Schedule Component Styles */
  .credit-payment-schedule {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    padding: 10px;
    margin-bottom: 12px;
  }
  
  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  
  .schedule-header h4 {
    margin: 0;
    color: #374151;
    font-size: 14px;
  }
  
  .agreement-details {
    width: 100%;
    font-size: 11px;
  }
  
  .agreement-details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 6px;
    background-color: #f9fafb;
    padding: 8px;
    border-radius: 4px;
    margin-top: 6px;
  }
  
  .agreement-details p {
    margin: 0;
    color: #64748b;
    line-height: 1.3;
  }
  
  .agreement-details .status-active {
    color: #0891b2;
    font-weight: 500;
  }
  
  .agreement-details .status-completed {
    color: #16a34a;
    font-weight: 500;
  }
  
  .agreement-details .status-overdue {
    color: #dc2626;
    font-weight: 500;
  }
  
  .schedule-timeline {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .schedule-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 15px;
    padding: 8px 10px;
    border-radius: 4px;
    background-color: #f8f9fa;
    border-left: 3px solid #e0e0e0;
  }
  
  .schedule-item:nth-child(odd) {
    background-color: #f1f3f5;
  }
  
  .schedule-item .payment-number {
    font-weight: bold;
    font-size: 12px;
    color: #34495e;
    min-width: 80px;
  }
  
  .schedule-item .payment-date {
    font-size: 14px;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .schedule-item .payment-amount {
    font-weight: bold;
    color: #2980b9;
  }
  
  .status-overdue {
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 10px;
  }
  
  .status-due-soon {
    color: #f39c12;
    background-color: rgba(243, 156, 18, 0.1);
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 10px;
  }
`;

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  originalPrice: number; // Price before discount
  discountAmount: number; // Amount discounted
  discountPercent: number; // Percentage discount (0-100)
}

// Generate payment dates from existing credit agreement - exported for reuse
const calculatePaymentDatesFromAgreement = (
  agreement: CreditAgreement
): Array<{ dueDate: Date; amount: number; isPaid: boolean; paymentNumber: number }> => {
  const paymentDates = [];
  const startDate = agreement.startDate.toDate();
  const dayOfMonth = startDate.getDate();
  
  // Create entry for each payment term
  for (let i = 0; i < agreement.totalTerms; i++) {
    // Calculate payment due date
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i + 1);
    
    // Handle month length differences (e.g., Jan 31 → Feb 28)
    const monthDays = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
    dueDate.setDate(Math.min(dayOfMonth, monthDays));
    
    // Check if this payment has been made
    // Simple check: if we have at least i+1 payments in history, this payment is paid
    const isPaid = agreement.paymentHistory && agreement.paymentHistory.length > i;
    
    paymentDates.push({
      dueDate,
      amount: agreement.monthlyPayment,
      isPaid,
      paymentNumber: i + 1
    });
  }
  
  return paymentDates;
};

// Utility function to check if a payment is due soon (within next 7 days)
const isPaymentDueSoon = (dueDate: Date): boolean => {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  return dueDate >= today && dueDate <= sevenDaysFromNow;
};

// Check if payment is overdue
const isPaymentOverdue = (dueDate: Date): boolean => {
  const today = new Date();
  return dueDate < today;
};

const POS = () => {
  const navigate = useNavigate();
  const { products, loading: productsLoading, updateProduct } = useProducts();
  const { customers, loading: customersLoading, addCustomer, updateCustomer } = useCustomers();
  const { addSale, getTodaysSales, getTotalSalesAmount } = useSales();
  const { addPayment } = usePayments();

  // Current section state
  const [currentSection, setCurrentSection] = useState("pos");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  
  // Generate payment schedule function for new credit agreements
  const generatePaymentSchedule = (terms: number, amount: number): Array<{date: Date, amount: number}> => {
    const schedule = [];
    const today = new Date();
    const dayOfMonth = today.getDate(); // Keep same day of month for consistency
    const monthlyPayment = amount / terms;
    
    for (let i = 0; i < terms; i++) {
      const paymentDate = new Date();
      paymentDate.setMonth(today.getMonth() + i + 1);
      
      // Adjust for months with fewer days
      const monthDays = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0).getDate();
      paymentDate.setDate(Math.min(dayOfMonth, monthDays));
      
      schedule.push({
        date: paymentDate,
        amount: monthlyPayment
      });
    }
    
    return schedule;
  };

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "gcash" | "credit"
  >("cash");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  // Discount states
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  
  // Credit specific states
  const [creditTerms, setCreditTerms] = useState<number>(3); // Default to 3 months
  const [initialPayment, setInitialPayment] = useState<string>("0"); // Initial partial payment
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  
  // COD specific states
  const [isCOD, setIsCOD] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  
  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // Filter products based on search (only show active products)
  const filteredProducts = products.filter(
    (product) =>
      product.active &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(newTotal);
  }, [cart]);

  // Listen for POS section changes from navbar
  useEffect(() => {
    const handlePOSSectionChange = (event: CustomEvent) => {
      const section = event.detail.section;
      if (section === "transaction-history") {
        // Navigate to the TransactionHistory page
        navigate("/transactions");
      } else if (section === "credit-payments") {
        // Navigate to the CreditPayments page
        navigate("/credit-payments");
      } else {
        setCurrentSection(section);
      }
    };

    window.addEventListener("posSectionChange", handlePOSSectionChange as EventListener);

    return () => {
      window.removeEventListener("posSectionChange", handlePOSSectionChange as EventListener);
    };
  }, [navigate]);

  // Add item to cart
  const addToCart = (product: Product) => {
    if ((product.stockQuantity || 0) <= 0) {
      alert("Product is out of stock!");
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= (product.stockQuantity || 0)) {
        alert("Cannot add more items than available stock!");
        return;
      }
      updateCartItem(product.id, existingItem.quantity + 1);
    } else {
      const cartItem: CartItem = {
        product,
        quantity: 1,
        originalPrice: product.price,
        discountAmount: 0,
        discountPercent: 0,
        subtotal: product.price,
      };
      setCart([...cart, cartItem]);
    }
  };

  // Update cart item quantity
  const updateCartItem = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > (product.stockQuantity || 0)) {
      alert("Cannot exceed available stock!");
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              // Calculate price after discount
              subtotal: (item.originalPrice - item.discountAmount) * newQuantity,
            }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Apply discount to cart item
  // Function to open the discount modal
  const openDiscountModal = (productId: string) => {
    setSelectedItemForDiscount(productId);
    setDiscountType('percent');
    setDiscountValue('0');
    setShowDiscountModal(true);
  };
  
  const applyDiscount = (productId: string, discountType: 'percent' | 'amount', value: number) => {
    if (value < 0) return;
    
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          let discountAmount = 0;
          let discountPercent = 0;
          
          if (discountType === 'percent') {
            // Limit percent discount to 100%
            const percentValue = Math.min(value, 100);
            discountAmount = item.product.price * (percentValue / 100);
            discountPercent = percentValue;
          } else {
            // Limit amount discount to product price
            discountAmount = Math.min(value, item.product.price);
            discountPercent = (discountAmount / item.product.price) * 100;
          }
          
          // Calculate new subtotal with discount
          const discountedPrice = item.product.price - discountAmount;
          const newSubtotal = discountedPrice * item.quantity;
          
          return {
            ...item,
            originalPrice: item.product.price,
            discountAmount: discountAmount,
            discountPercent: discountPercent,
            subtotal: newSubtotal
          };
        }
        return item;
      })
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod("cash");
    setAmountPaid("");
    setPaymentReference("");
    setCreditTerms(3);
    setInitialPayment("0");
  };

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert("Customer name is required!");
      return;
    }

    try {
      await addCustomer({
        name: newCustomerName.trim(),
        contact: newCustomerContact.trim() || undefined,
        creditBalance: 0,
        creditAgreements: [], // Add the required property
      });
      setNewCustomerName("");
      setNewCustomerContact("");
      setShowCustomerForm(false);
      alert("Customer added successfully!");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer!");
    }
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (paymentMethod === "gcash" && !paymentReference.trim()) {
      alert("GCash reference number is required!");
      return;
    }

    // For credit sales, we need a customer
    if (paymentMethod === "credit" && !selectedCustomer) {
      alert("Please select a customer for credit payment!");
      return;
    }
    
    // Validate COD requirements
    if (isCOD) {
      // COD requires a customer 
      if (!selectedCustomer) {
        alert("Please select a customer for Cash on Delivery!");
        return;
      }
      
      // COD requires delivery address
      if (!deliveryAddress.trim()) {
        alert("Delivery address is required for COD orders!");
        return;
      }
      
      // COD requires delivery date
      if (!deliveryDate) {
        alert("Delivery date is required for COD orders!");
        return;
      }
    }

    const initialPaidAmount = 
      paymentMethod === "cash" ? parseFloat(amountPaid) || total : 
      paymentMethod === "credit" ? parseFloat(initialPayment) || 0 : total;

    if (paymentMethod === "cash" && initialPaidAmount < total) {
      alert("Insufficient payment amount!");
      return;
    }

    try {
      // Prepare sale data
      const saleItems = cart.map((item) => ({
        productId: doc(db, "products", item.product.id),
        qty: item.quantity,
        price: item.product.price - item.discountAmount, // Store discounted price
        originalPrice: item.product.price,
        discountAmount: item.discountAmount,
        discountPercent: item.discountPercent
      }));

      // Calculate discount totals
      const originalTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const discountTotal = cart.reduce((sum, item) => sum + (item.discountAmount * item.quantity), 0);

      const saleData: any = {
        items: saleItems,
        total,
        originalTotal,
        discountTotal,
        paymentMethod,
        date: Timestamp.now(),
        paymentIds: [],
        amountPaid: initialPaidAmount,
      };

      // Only add customerId if customer is selected
      if (selectedCustomer) {
        saleData.customerId = doc(db, "customers", selectedCustomer.id);
      }

      // Add GCash reference if present
      if (paymentMethod === "gcash" && paymentReference) {
        saleData.referenceCode = paymentReference;
      }
      
      // Add COD specific fields if it's a COD order
      if (isCOD) {
        saleData.isCOD = true;
        saleData.deliveryAddress = deliveryAddress;
        saleData.deliveryDate = deliveryDate ? Timestamp.fromDate(deliveryDate) : null;
        saleData.deliveryStatus = 'pending';
        
        // For COD orders, set credit status if payment is not complete
        if (initialPaidAmount < total) {
          saleData.creditStatus = initialPaidAmount > 0 ? "partial" : "pending";
          saleData.dueDate = Timestamp.fromDate(deliveryDate || new Date());
        }
      }

      // Handle credit specific fields
      if (paymentMethod === "credit") {
        saleData.creditStatus = initialPaidAmount > 0 ? "partial" : "pending";
        saleData.dueDate = Timestamp.fromDate(
          new Date(Date.now() + creditTerms * 30 * 24 * 60 * 60 * 1000) // Approximate months to milliseconds
        );
      }

      // Add sale to database
      const newSaleId = await addSale(saleData);

      // Update product stock quantities
      for (const item of cart) {
        const newStockQuantity =
          (item.product.stockQuantity || 0) - item.quantity;
        await updateProduct(item.product.id, {
          stockQuantity: newStockQuantity,
        });
      }

      // Calculate change for cash payments
      let change = 0;
      if (paymentMethod === "cash" && initialPaidAmount > total) {
        change = initialPaidAmount - total;
      }
      
      setChangeAmount(change);
      
      // For credit sales, create credit agreement
      if (paymentMethod === "credit" && selectedCustomer) {
        const creditAmount = total - initialPaidAmount;
        const monthlyPayment = creditAmount / creditTerms;
        
        // Log complete payment schedule
        console.log('Complete Payment Schedule:', {
          customer: selectedCustomer.name,
          totalAmount: total,
          initialPayment: initialPaidAmount,
          creditAmount: creditAmount,
          terms: creditTerms,
          schedule: generatePaymentSchedule(creditTerms, creditAmount)
        });
        
        const now = Timestamp.now();
        // Due date is exactly (creditTerms * 30) days from now
        const dueDate = Timestamp.fromDate(
          new Date(Date.now() + creditTerms * 30 * 24 * 60 * 60 * 1000)
        );
        // Next payment is exactly 30 days from now
        const nextPaymentDue = Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Exactly 30 days from now
        );
        
        // Generate payment schedule dates using 30-day increments
        const paymentDates: Timestamp[] = [];
        let previousDate = new Date(now.toDate()); // Start with the current date
        
        console.log("==== CREDIT AGREEMENT PAYMENT DATES CALCULATION ====");
        console.log(`Start Date: ${previousDate.toLocaleDateString()}`);
        console.log(`Credit Terms: ${creditTerms}`);
        
        for (let i = 0; i < creditTerms; i++) {
          // Each payment is exactly 30 days after the previous one
          const paymentDate = new Date(previousDate);
          paymentDate.setDate(paymentDate.getDate() + 30); // Always add 30 days
          
          console.log(`Term ${i+1}: ${previousDate.toLocaleDateString()} + 30 days = ${paymentDate.toLocaleDateString()}`);
          
          // Save this as the previous date for next calculation
          previousDate = new Date(paymentDate);
          
          paymentDates.push(Timestamp.fromDate(paymentDate));
        }
        
        // Create credit agreement with payment schedule
        const creditAgreement: CreateCreditAgreement = {
          saleId: doc(db, "sales", typeof newSaleId === 'string' ? newSaleId : "error"),
          principalAmount: creditAmount,
          remainingBalance: creditAmount,
          monthlyPayment: monthlyPayment,
          totalTerms: creditTerms,
          remainingTerms: creditTerms,
          startDate: now,
          dueDate: dueDate,
          nextPaymentDue: nextPaymentDue,
          status: 'active',
          paymentHistory: [],
          createdAt: now,
          // Add the payment dates to the agreement document
          paymentDates: paymentDates
        };
        
        // Log credit agreement details with payment schedule
        const paymentSchedule = [];
        let scheduleDate = now.toDate();
        
        console.log("==== PAYMENT SCHEDULE CALCULATION ====");
        console.log(`Start Date: ${scheduleDate.toLocaleDateString()}`);
        
        for (let i = 0; i < creditTerms; i++) {
          // Calculate payment due date - each payment is 30 days after the previous
          const paymentDate = new Date(scheduleDate);
          paymentDate.setDate(paymentDate.getDate() + 30);
          
          console.log(`Term ${i+1}: ${scheduleDate.toLocaleDateString()} + 30 days = ${paymentDate.toLocaleDateString()}`);
          
          // Save for next iteration
          scheduleDate = new Date(paymentDate);
          
          paymentSchedule.push({
            dueDate: paymentDate,
            paymentNumber: i + 1,
            amount: monthlyPayment,
            status: 'Not Paid'
          });
        }
        
        console.log('Creating Credit Agreement:', {
          saleId: newSaleId,
          customer: selectedCustomer?.name,
          principalAmount: creditAmount,
          terms: creditTerms,
          monthlyPayment: monthlyPayment,
          dueDate: dueDate.toDate()
        });
        
        // Log payment schedule in a more readable format
        console.log('Payment Schedule:');
        paymentSchedule.forEach(payment => {
          const dateStr = payment.dueDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
          });
          console.log(`${dateStr} - ${payment.status} - ₱${payment.amount.toFixed(2)}`);
        });
        
        // Add credit agreement to database
        const creditAgreementRef = await addDoc(collection(db, "creditAgreements"), creditAgreement);
        
        // Log successful creation with ID
        console.log('Credit Agreement created with ID:', creditAgreementRef.id);
        
        // Create a more readable payment schedule log in "Month Day, Year - Not Paid" format
        console.log('Monthly Payment Schedule:');
        paymentDates.forEach((timestamp, i) => {
          const date = timestamp.toDate();
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          
          // Calculate days between payments
          if (i > 0) {
            const previousDate = paymentDates[i-1].toDate();
            const daysBetween = Math.floor((date.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`Payment ${i+1}: ${formattedDate} - Not Paid (${daysBetween} days after previous payment)`);
          } else {
            console.log(`Payment 1: ${formattedDate} - Not Paid (30 days after start date)`);
          }
        });
        
        console.log("==== END PAYMENT SCHEDULE LOG ====");
        
        // Create initial payment record if there's an initial payment
        if (initialPaidAmount > 0) {
          const paymentData = {
            saleId: doc(db, "sales", typeof newSaleId === 'string' ? newSaleId : "error"),
            creditAgreementId: creditAgreementRef.id,
            customerId: doc(db, "customers", selectedCustomer.id),
            amount: initialPaidAmount,
            date: now,
            paymentMethod: "cash" as "cash" | "gcash" | "transfer" | "check", // Initial payment is typically cash
            paymentType: "credit_payment" as "sale" | "credit_payment",
            referenceCode: `INITIAL-${newSaleId}`,
            notes: "Initial payment on credit agreement"
          };
          
          const paymentId = await addPayment(paymentData);
          
          // Update credit agreement with payment history
          await updateDoc(creditAgreementRef, {
            paymentHistory: [paymentId]
          });
          
          // Log initial payment
          console.log('Initial payment recorded:', {
            creditAgreementId: creditAgreementRef.id,
            paymentId: paymentId,
            amount: initialPaidAmount
          });
        }
        
        // Update customer's credit balance and agreements
        if (selectedCustomer) {
          const updatedCustomer = { ...selectedCustomer };
          const newCreditBalance = (updatedCustomer.creditBalance || 0) + creditAmount;
          
          // Add credit agreement to customer's agreements list
          const newCreditAgreement = {
            ...creditAgreement,
            id: creditAgreementRef.id
          };
          
          const updatedAgreements = [...(updatedCustomer.creditAgreements || []), newCreditAgreement];
          
          await updateCustomer(selectedCustomer.id, {
            creditBalance: newCreditBalance,
            creditAgreements: updatedAgreements,
            lastPaymentDate: initialPaidAmount > 0 ? now : undefined
          });
          
          // Log customer credit update
          console.log('Customer credit updated:', {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            newCreditBalance: newCreditBalance,
            agreementCount: updatedAgreements.length
          });
        }
      }
      
      // Set completed sale for receipt modal
      setCompletedSale({
        id: typeof newSaleId === 'string' ? newSaleId : "temp-id",
        items: saleItems,
        paymentMethod,
        date: saleData.date,
        total,
        amountPaid: initialPaidAmount,
        customerId: selectedCustomer ? doc(db, "customers", selectedCustomer.id) : undefined,
        referenceCode: paymentMethod === 'gcash' ? paymentReference : undefined,
        paymentIds: [],
        creditStatus: (paymentMethod === 'credit' || (isCOD && initialPaidAmount < total)) ? 
          (initialPaidAmount > 0 ? "partial" : "pending") : undefined,
        dueDate: (paymentMethod === 'credit' || (isCOD && initialPaidAmount < total)) ? 
          saleData.dueDate : undefined,
        // COD specific fields
        isCOD: isCOD || undefined,
        deliveryAddress: isCOD ? deliveryAddress : undefined,
        deliveryDate: isCOD && deliveryDate ? Timestamp.fromDate(deliveryDate) : undefined
      });
      
      // Show receipt modal for all payment types
      setShowReceiptModal(true);

      // Clear cart
      clearCart();
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Failed to process sale!");
    }
  };

  const todaysSales = getTodaysSales();
  const todaysTotal = getTotalSalesAmount(todaysSales);

  if (productsLoading || customersLoading) {
    return <div className="pos-loading">Loading POS system...</div>;
  }

  return (
    <div className="pos-container">
      {/* Add credit styles */}
      <style>{creditFormStyles}</style>
      {/* Header */}
      <div className="pos-header">
        <h1>Point of Sale</h1>
        <div className="pos-stats">
          <div className="stat-card">
            <span className="stat-label">Today's Sales</span>
            <span className="stat-value">₱{todaysTotal.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Transactions</span>
            <span className="stat-value">{todaysSales.length}</span>
          </div>
        </div>
      </div>

      {/* Render different sections based on current selection */}
      {currentSection === "pos" && (
        <div className="pos-main">
          {/* Products Section */}
          <div className="pos-products">
            <div className="products-header">
              <h2>Products</h2>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="product-search"
              />
            </div>
            <div className="products-list">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`product-item ${
                    (product.stockQuantity || 0) <= 0 ? "out-of-stock" : ""
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <div className="product-main-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-sku">{product.sku}</p>
                  </div>
                  <div className="product-details">
                    <span className="product-price">
                      ₱{product.price.toFixed(2)}
                    </span>
                    <span className="product-stock">
                      Stock: {product.stockQuantity || 0}
                    </span>
                  </div>
                  <div className="product-action">
                    <button className="add-to-cart-btn">Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="pos-cart">
            <div className="cart-header">
              <h2>Cart</h2>
              <button onClick={clearCart} className="clear-cart-btn">
                Clear
              </button>
            </div>

            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.product.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.product.name}</h4>
                    <p>₱{item.product.price.toFixed(2)} each</p>
                  </div>
                  <div className="item-controls">
                    <button
                      onClick={() =>
                        updateCartItem(item.product.id, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateCartItem(item.product.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="item-subtotal">₱{item.subtotal.toFixed(2)}</div>
                  <div className="cart-item-actions">
                    <button
                      className="discount-item-btn"
                      onClick={() => openDiscountModal(item.product.id)}
                      title="Apply Discount"
                    >
                      %
                    </button>
                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="payment-section">
              <div className="total">
                <h3>Total: ₱{total.toFixed(2)}</h3>
              </div>

              {/* Customer Selection */}
              <div className="customer-section">
                <label>Customer (Optional):</label>
                <div className="customer-controls">
                  <select
                    value={selectedCustomer?.id || ""}
                    onChange={(e) => {
                      const customer = customers.find(
                        (c) => c.id === e.target.value
                      );
                      setSelectedCustomer(customer || null);
                    }}
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}{" "}
                        {customer.contact && `(${customer.contact})`}
                      </option>
                    ))}
                  </select>
                  <button
                    className="add-customer-btn"
                    onClick={() => setShowCustomerForm(true)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="payment-method">
                <label>Payment Method:</label>
                <div className="payment-options">
                  <label>
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "cash")}
                    />
                    Cash
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="gcash"
                      checked={paymentMethod === "gcash"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as "gcash")
                      }
                    />
                    GCash
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="credit"
                      checked={paymentMethod === "credit"}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value as "credit");
                        if (!selectedCustomer) {
                          alert("Please select a customer for credit payment");
                          setPaymentMethod("cash");
                        }
                      }}
                    />
                    Credit
                  </label>
                </div>
              </div>

              {/* COD (Cash on Delivery) Option */}
              <div className="cod-option">
                <label className="cod-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isCOD}
                    onChange={(e) => {
                      setIsCOD(e.target.checked);
                      // If enabling COD and no customer is selected, require one
                      if (e.target.checked && !selectedCustomer) {
                        alert("Please select a customer for COD orders");
                        setIsCOD(false);
                      }
                    }}
                  />
                  Cash on Delivery (COD)
                </label>
              </div>

              {/* Cash Payment Amount */}
              {paymentMethod === "cash" && (
                <div className="payment-amount">
                  <label>Amount Paid:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Enter amount paid"
                  />
                  {parseFloat(amountPaid) > total && (
                    <p className="change">
                      Change: ₱{(parseFloat(amountPaid) - total).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* GCash Reference */}
              {paymentMethod === "gcash" && (
                <div className="payment-reference">
                  <label>GCash Reference:</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter GCash reference number"
                  />
                </div>
              )}
              
              {/* COD Details - shown when COD is checked */}
              {isCOD && (
                <div className="cod-details">
                  <h4>Cash on Delivery Details</h4>
                  <div className="cod-form">
                    <div className="form-group">
                      <label>Delivery Address:</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter delivery address"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Delivery Date:</label>
                      <input
                        type="date"
                        value={deliveryDate ? deliveryDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDeliveryDate(e.target.value ? new Date(e.target.value) : null)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Options - Inline */}
              {paymentMethod === "credit" && selectedCustomer && (
                <div className="credit-options">
                  <h4>Credit Payment Setup</h4>
                  <div className="credit-form">
                    <div className="form-group">
                      <label>Number of Months:</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={creditTerms}
                        onChange={(e) => {
                          const terms = parseInt(e.target.value) || 1;
                          setCreditTerms(terms);
                          // Log payment schedule when terms change
                          console.log('Payment Schedule:', generatePaymentSchedule(terms, total - parseFloat(initialPayment || "0")));
                        }}
                        placeholder="Number of payment terms"
                      />
                    </div>
                    <div className="form-group">
                      <label>Initial Payment (₱):</label>
                      <input
                        type="number"
                        min="0"
                        max={total}
                        step="0.01"
                        value={initialPayment}
                        onChange={(e) => setInitialPayment(e.target.value)}
                        placeholder="Amount paid now (0 for full credit)"
                      />
                    </div>
                  </div>
                  <div className="credit-summary">
                    <div className="summary-header">Credit Agreement Summary</div>
                    <p><strong>Customer:</strong> {selectedCustomer?.name}</p>
                    <p><strong>Total Amount:</strong> ₱{total.toFixed(2)}</p>
                    <p><strong>Initial Payment:</strong> ₱{parseFloat(initialPayment || "0").toFixed(2)}</p>
                    <p><strong>Credit Amount:</strong> ₱{(total - parseFloat(initialPayment || "0")).toFixed(2)}</p>
                    <p><strong>Monthly Payment:</strong> ₱{((total - parseFloat(initialPayment || "0")) / creditTerms).toFixed(2)}</p>
                    
                    {/* Payment Timeline */}
                    <div className="payment-timeline">
                      <h4>Payment Schedule</h4>
                      <div className="timeline-container">
                        {generatePaymentSchedule(creditTerms, total - parseFloat(initialPayment || "0")).map((payment, i) => (
                          <div key={i} className="timeline-item">
                            <div className="timeline-date">
                              {payment.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="timeline-amount">
                              ₱{payment.amount.toFixed(2)}
                            </div>
                            <div className="timeline-status">
                              <span className={i === 0 ? "status-upcoming" : "status-pending"}>
                                {i === 0 ? "Upcoming" : "Not Paid"}
                              </span>
                            </div>
                            <div className="timeline-payment-number">
                              Payment #{i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <p className="credit-warning">Important: Credit sales require proper tracking and follow-up!</p>
                    <p className="credit-info">Monthly payments should be collected within the credit term period.</p>
                  </div>
                </div>
              )}

              {/* Process Sale Button */}
              <button
                className="process-sale-btn"
                onClick={processSale}
                disabled={cart.length === 0}
              >
                Process Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Customer</h3>
            <div className="form-group">
              <label>Name *:</label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label>Contact:</label>
              <input
                type="text"
                value={newCustomerContact}
                onChange={(e) => setNewCustomerContact(e.target.value)}
                placeholder="Enter phone number or email"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleAddCustomer} className="save-btn">
                Add Customer
              </button>
              <button
                onClick={() => setShowCustomerForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Terms Modal Removed - now showing inline */}

      {/* Discount Modal */}
      {showDiscountModal && selectedItemForDiscount && (
        <div className="modal-overlay">
          <div className="modal-content discount-modal">
            <h3>Apply Discount</h3>
            <div className="discount-form">
              <div className="form-group">
                <label>Discount Type:</label>
                <div className="discount-type-options">
                  <label>
                    <input
                      type="radio"
                      value="percent"
                      checked={discountType === 'percent'}
                      onChange={() => setDiscountType('percent')}
                    />
                    Percentage (%)
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="amount"
                      checked={discountType === 'amount'}
                      onChange={() => setDiscountType('amount')}
                    />
                    Fixed Amount (₱)
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>
                  {discountType === 'percent' ? 'Discount Percentage:' : 'Discount Amount:'}
                </label>
                <div className="input-with-unit">
                  {discountType === 'amount' && <span className="unit-prefix">₱</span>}
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? "100" : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="discount-input"
                  />
                  {discountType === 'percent' && <span className="unit-suffix">%</span>}
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  onClick={() => {
                    // Apply the discount
                    const numValue = parseFloat(discountValue) || 0;
                    applyDiscount(selectedItemForDiscount, discountType, numValue);
                    setShowDiscountModal(false);
                  }}
                  className="apply-btn"
                >
                  Apply Discount
                </button>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && completedSale && (
        <ReceiptModal
          show={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          sale={completedSale}
          products={products}
          customer={selectedCustomer}
          change={changeAmount}
        />
      )}
    </div>
  );
};

// Component to display credit agreement payment schedule
// This can be extracted to its own file and used in the Credit Payments page
export const CreditPaymentSchedule = ({ agreement }: { agreement: CreditAgreement }) => {
  // Calculate payment dates and status - use paymentDates array if available
  const paymentSchedule = agreement.paymentDates 
    ? agreement.paymentDates.map((date, index) => ({
        dueDate: date.toDate(),
        amount: agreement.monthlyPayment,
        isPaid: agreement.paymentHistory && agreement.paymentHistory.length > index,
        paymentNumber: index + 1
      }))
    : calculatePaymentDatesFromAgreement(agreement);
  
  return (
    <div className="credit-payment-schedule">
      <div className="schedule-header">
        <h4>Payment Schedule</h4>
        <div className="agreement-details">
          <div className="agreement-details-grid">
            <p><strong>Principal:</strong> ₱{agreement.principalAmount.toFixed(2)}</p>
            <p><strong>Monthly:</strong> ₱{agreement.monthlyPayment.toFixed(2)}</p>
            <p><strong>Remaining:</strong> ₱{agreement.remainingBalance.toFixed(2)}</p>
            <p><strong>Terms:</strong> {agreement.totalTerms}</p>
            <p><strong>Start:</strong> {agreement.startDate.toDate().toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {agreement.dueDate.toDate().toLocaleDateString()}</p>
            <p><strong>Remaining Terms:</strong> {agreement.remainingTerms}</p>
            <p><strong>Status:</strong> <span className={`status-${agreement.status}`}>{agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}</span></p>
          </div>
        </div>
      </div>
      
      <div className="schedule-timeline">
        {paymentSchedule.map((payment: { 
            dueDate: Date; 
            amount: number; 
            isPaid: boolean; 
            paymentNumber: number 
          }, index: number) => {
          // Determine payment status with more detailed tracking
          let statusClass = "status-pending";
          let statusText = "Not Paid";
          
          if (payment.isPaid) {
            statusClass = "status-paid";
            statusText = "Paid";
          } else if (isPaymentOverdue(payment.dueDate)) {
            statusClass = "status-overdue";
            statusText = "Overdue";
          } else if (isPaymentDueSoon(payment.dueDate)) {
            statusClass = "status-due-soon";
            statusText = "Due Soon";
          } else if (
            // First unpaid payment that's not overdue
            !payment.isPaid && 
            paymentSchedule.findIndex(p => !p.isPaid) === index
          ) {
            statusClass = "status-upcoming";
            statusText = "Next Payment";
          }
          
          return (
            <div key={index} className="schedule-item">
              <div className="payment-number">Payment #{payment.paymentNumber}</div>
              <div className="payment-date">
                {payment.dueDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <span className={statusClass}>{statusText}</span>
              <div className="payment-amount">{payment.amount.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Utility function to log payment schedule in a readable format
export const logPaymentSchedule = (agreement: CreditAgreement): void => {
  console.log(`Payment Schedule for Agreement ${agreement.id}:`);
  console.log(`Total Amount: ₱${agreement.principalAmount.toFixed(2)}`);
  console.log(`Monthly Payment: ₱${agreement.monthlyPayment.toFixed(2)}`);
  
  const payments = calculatePaymentDatesFromAgreement(agreement);
  console.log(`Schedule:`);
  payments.forEach(payment => {
    const dateStr = payment.dueDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    });
    const status = payment.isPaid ? "Paid" : "Not Paid";
    console.log(`${dateStr} - ${status} - ₱${payment.amount.toFixed(2)}`);
  });
};

export default POS;
