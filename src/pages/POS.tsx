import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import useProducts from "../hooks/useProducts";
import useCustomers from "../hooks/useCustomers";
import useSales from "../hooks/useSales";
import { usePayments } from "../hooks/usePayments";
import type { Product, Customer, CreateCreditAgreement } from "../types";
import "../styles/POS.css";

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

const POS = () => {
  const navigate = useNavigate();
  const { products, loading: productsLoading, updateProduct } = useProducts();
  const { customers, loading: customersLoading, addCustomer } = useCustomers();
  const { addSale, getTodaysSales, getTotalSalesAmount, sales } = useSales();
  const { addPayment } = usePayments();

  // Current section state
  const [currentSection, setCurrentSection] = useState("pos");

  // Credit payment state
  const [creditPaymentAmount, setCreditPaymentAmount] = useState<string>("");
  const [creditPaymentMethod, setCreditPaymentMethod] = useState<"cash" | "gcash" | "transfer" | "check">("cash");
  const [creditPaymentReference, setCreditPaymentReference] = useState("");
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<Customer | null>(null);
  const [expandedAgreements, setExpandedAgreements] = useState<Set<string>>(new Set());

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "gcash" | "credit"
  >("cash");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  
  // Partial payment and terms state
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("3"); // Default 3 months
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  
  // Filter products based on search (only show active products)
  const filteredProducts = products.filter(
    (product) =>
      product.active &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()))  );
  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(newTotal);
  }, [cart]);

  // Calculate monthly payment when terms or partial amount changes
  useEffect(() => {
    if (isPartialPayment && partialAmount && paymentTerms) {
      const partial = parseFloat(partialAmount);
      const terms = parseInt(paymentTerms);
      const remainingBalance = total - partial;
      
      if (remainingBalance > 0 && terms > 0) {
        const monthly = remainingBalance / terms;
        setMonthlyPayment(monthly);
      } else {
        setMonthlyPayment(0);
      }
    } else {
      setMonthlyPayment(0);
    }
  }, [isPartialPayment, partialAmount, paymentTerms, total]);
  // Listen for POS section changes from navbar
  useEffect(() => {
    const handlePOSSectionChange = (event: CustomEvent) => {
      const section = event.detail.section;
        if (section === "transaction-history") {
        // Navigate to the TransactionHistory page
        navigate("/transactions");
      } else {
        // Set the section for other sections (like credit-payments)
        setCurrentSection(section);
      }
    };

    window.addEventListener(
      "posSectionChange",
      handlePOSSectionChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "posSectionChange",
        handlePOSSectionChange as EventListener
      );
    };
  }, [navigate]);

  // Debug logging for selectedCreditCustomer
  useEffect(() => {
    if (selectedCreditCustomer) {
      console.log("=== SELECTED CREDIT CUSTOMER ===");
      console.log("Customer ID:", selectedCreditCustomer.id);
      console.log("Customer Name:", selectedCreditCustomer.name);
      console.log("Customer Contact:", selectedCreditCustomer.contact);
      console.log("Credit Balance:", selectedCreditCustomer.creditBalance);
      console.log("Credit Agreements:", selectedCreditCustomer.creditAgreements);
      console.log("Number of Credit Agreements:", selectedCreditCustomer.creditAgreements?.length || 0);
      
      if (selectedCreditCustomer.creditAgreements && selectedCreditCustomer.creditAgreements.length > 0) {
        selectedCreditCustomer.creditAgreements.forEach((agreement, index) => {
          console.log(`Agreement ${index + 1}:`, agreement);
          console.log(`  - ID: ${agreement.id}`);
          console.log(`  - Status: ${agreement.status}`);
          console.log(`  - Principal Amount: ${agreement.principalAmount}`);
          console.log(`  - Remaining Balance: ${agreement.remainingBalance}`);
          console.log(`  - Monthly Payment: ${agreement.monthlyPayment}`);
          console.log(`  - Total Terms: ${agreement.totalTerms}`);
          console.log(`  - Remaining Terms: ${agreement.remainingTerms}`);
          console.log(`  - Start Date: ${agreement.startDate.toDate().toLocaleDateString()}`);
          console.log(`  - Due Date: ${agreement.dueDate.toDate().toLocaleDateString()}`);
          console.log(`  - Next Payment Due: ${agreement.nextPaymentDue.toDate().toLocaleDateString()}`);
          console.log(`  - Payment History: ${agreement.paymentHistory.length} payments`);
          if (agreement.createdAt) {
            console.log(`  - Created At: ${agreement.createdAt.toDate().toLocaleDateString()}`);
          }
        });
      }
      console.log("=== END CUSTOMER DEBUG ===");
    } else {
      console.log("No credit customer selected");
    }
  }, [selectedCreditCustomer]);

  // Get customers with outstanding credit balance
  const customersWithCredit = customers.filter(customer => (customer.creditBalance || 0) > 0);
  
  // Debug logging for customers
  useEffect(() => {
    console.log("=== ALL CUSTOMERS ===");
    console.log("Total customers:", customers.length);
    console.log("Customers with credit:", customersWithCredit.length);
    
    customers.forEach((customer, index) => {
      console.log(`Customer ${index + 1}:`, {
        id: customer.id,
        name: customer.name,
        creditBalance: customer.creditBalance,
        creditAgreements: customer.creditAgreements?.length || 0,
        hasCredit: (customer.creditBalance || 0) > 0
      });
    });
    
    console.log("Customers with credit balance > 0:", customersWithCredit.map(c => ({
      id: c.id,
      name: c.name,
      creditBalance: c.creditBalance,
      agreements: c.creditAgreements?.length || 0
    })));
    console.log("=== END CUSTOMERS DEBUG ===");
  }, [customers, customersWithCredit]);

  // Toggle agreement expansion
  const toggleAgreementExpansion = (agreementId: string) => {
    setExpandedAgreements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agreementId)) {
        newSet.delete(agreementId);
      } else {
        newSet.add(agreementId);
      }
      return newSet;
    });
  };

  // Credit Payment handler
  const processCreditPayment = async () => {
    if (!selectedCreditCustomer) {
      alert("Please select a customer!");
      return;
    }

    const paymentAmount = parseFloat(creditPaymentAmount);
    if (!paymentAmount || paymentAmount <= 0) {
      alert("Please enter a valid payment amount!");
      return;
    }

    if (paymentAmount > (selectedCreditCustomer.creditBalance || 0)) {
      alert("Payment amount cannot exceed outstanding balance!");
      return;
    }

    if (creditPaymentMethod === "gcash" && !creditPaymentReference.trim()) {
      alert("Please enter GCash reference number!");
      return;
    }

    try {
      // Get customer's credit sales for payment reference
      const customerSales = sales
        .filter(sale => {
          const customerIdMatch = sale.customerId && 
            (typeof sale.customerId === 'string' ? 
              sale.customerId === selectedCreditCustomer.id : 
              sale.customerId.id === selectedCreditCustomer.id);
          
          return customerIdMatch && sale.paymentMethod === 'credit';
        })
        .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());

      if (customerSales.length === 0) {
        alert("No credit sales found for this customer!");
        return;
      }

      // Use the most recent credit sale for payment reference
      const targetSale = customerSales[0];

      // Create payment record
      const paymentData: any = {
        saleId: doc(db, "sales", targetSale.id),
        customerId: doc(db, "customers", selectedCreditCustomer.id),
        amount: paymentAmount,
        date: Timestamp.now(),
        paymentMethod: creditPaymentMethod,
        paymentType: 'credit_payment',
      };

      // Add reference based on payment method
      if (creditPaymentMethod === "gcash" && creditPaymentReference.trim()) {
        paymentData.gcashReferenceNumber = creditPaymentReference.trim();
      } else if (creditPaymentMethod === "transfer" && creditPaymentReference.trim()) {
        paymentData.referenceCode = creditPaymentReference.trim();
      } else if (creditPaymentMethod === "check" && creditPaymentReference.trim()) {
        paymentData.checkNumber = creditPaymentReference.trim();
      }

      // Add payment to database
      const paymentDoc = await addPayment(paymentData);

      // Update customer credit balance and credit agreements
      const newCreditBalance = (selectedCreditCustomer.creditBalance || 0) - paymentAmount;
      
      // Update credit agreements - allocate payment to active agreements
      const updatedAgreements = [...(selectedCreditCustomer.creditAgreements || [])];
      let remainingPayment = paymentAmount;
      
      for (let i = 0; i < updatedAgreements.length && remainingPayment > 0; i++) {
        const agreement = updatedAgreements[i];
        if (agreement.status === 'active' && agreement.remainingBalance > 0) {
          const paymentToThisAgreement = Math.min(remainingPayment, agreement.remainingBalance);
          
          // Update agreement
          agreement.remainingBalance -= paymentToThisAgreement;
          agreement.paymentHistory.push(paymentDoc || 'unknown');
          
          // Update remaining terms and status
          if (agreement.remainingBalance <= 0) {
            agreement.status = 'completed';
            agreement.remainingTerms = 0;
          } else {
            // Calculate new remaining terms based on monthly payment
            if (agreement.monthlyPayment > 0) {
              agreement.remainingTerms = Math.ceil(agreement.remainingBalance / agreement.monthlyPayment);
            }
          }
          
          // Update next payment due date if not completed
          if (agreement.status === 'active') {
            const nextDue = new Date();
            nextDue.setMonth(nextDue.getMonth() + 1);
            agreement.nextPaymentDue = Timestamp.fromDate(nextDue);
          }
          
          // Update the corresponding document in creditAgreements collection
          if (agreement.id) {
            await updateDoc(doc(db, "creditAgreements", agreement.id), {
              remainingBalance: agreement.remainingBalance,
              paymentHistory: agreement.paymentHistory,
              status: agreement.status,
              remainingTerms: agreement.remainingTerms,
              nextPaymentDue: agreement.nextPaymentDue,
            });
          }
          
          remainingPayment -= paymentToThisAgreement;
        }
      }

      // Update customer document
      await updateDoc(doc(db, "customers", selectedCreditCustomer.id), {
        creditBalance: newCreditBalance,
        creditAgreements: updatedAgreements,
        lastPaymentDate: Timestamp.now(),
      });

      alert(`Payment of ₱${paymentAmount.toFixed(2)} processed successfully!`);
      
      // Clear credit payment form
      setSelectedCreditCustomer(null);
      setCreditPaymentAmount("");
      setCreditPaymentReference("");
    } catch (error) {
      console.error("Error processing credit payment:", error);
      alert("Failed to process payment!");
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    if (!product.stockQuantity || product.stockQuantity <= 0) {
      alert("Product is out of stock!");
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        alert("Not enough stock available!");
        return;
      }
      updateCartItem(product.id, existingItem.quantity + 1);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          subtotal: product.price,
        },
      ]);
    }
  };

  // Update cart item quantity
  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product || quantity > (product.stockQuantity || 0)) {
      alert("Not enough stock available!");
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity, subtotal: item.product.price * quantity }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod("cash");
    setAmountPaid("");
    setPaymentReference("");
    setIsPartialPayment(false);
    setPartialAmount("");
    setPaymentTerms("3");
    setMonthlyPayment(0);
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
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer!");
    }  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomer) {
      alert("Please select a customer for credit sales!");
      return;
    }

    if (paymentMethod === "gcash" && !paymentReference.trim()) {
      alert("GCash reference number is required!");
      return;
    }

    // Validate partial payment if enabled
    if (paymentMethod === "credit" && isPartialPayment) {
      const partial = parseFloat(partialAmount);
      const terms = parseInt(paymentTerms);
      
      if (!partial || partial <= 0) {
        alert("Please enter a valid partial payment amount!");
        return;
      }
      
      if (partial >= total) {
        alert("Partial payment cannot be equal to or greater than total amount!");
        return;
      }
      
      if (!terms || terms <= 0) {
        alert("Please enter valid payment terms!");
        return;
      }
    }

    const paidAmount = paymentMethod === "cash" ? parseFloat(amountPaid) || total : 
                      paymentMethod === "credit" && isPartialPayment ? parseFloat(partialAmount) : 
                      total;

    if (paymentMethod === "cash" && paidAmount < total) {
      alert("Insufficient payment amount!");
      return;
    }

    try {
      // Prepare sale data
      const saleItems = cart.map((item) => ({
        productId: doc(db, "products", item.product.id),
        qty: item.quantity,
        price: item.product.price,
      }));

      const saleData: any = {
        items: saleItems,
        total,
        paymentMethod,
        date: Timestamp.now(),
        paymentIds: [],
      };

      // Only add customerId if customer is selected
      if (selectedCustomer) {
        saleData.customerId = doc(db, "customers", selectedCustomer.id);
      }

      // Handle different payment methods
      if (paymentMethod === "credit") {
        if (isPartialPayment) {
          // Partial payment with custom terms
          saleData.creditStatus = "partial";
          saleData.amountPaid = parseFloat(partialAmount);
          const terms = parseInt(paymentTerms);
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + terms);
          saleData.dueDate = Timestamp.fromDate(dueDate);
        } else {
          // Full credit sale
          saleData.creditStatus = "pending";
          saleData.amountPaid = 0;
          saleData.dueDate = Timestamp.fromDate(
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          );
        }
      } else {
        saleData.amountPaid = paidAmount;
      }

      // Add sale to database
      await addSale(saleData);

      // Update product stock quantities
      for (const item of cart) {
        const newStockQuantity =
          (item.product.stockQuantity || 0) - item.quantity;
        await updateProduct(item.product.id, {
          stockQuantity: newStockQuantity,
        });
      }

      // Update customer credit balance if credit sale
      if (paymentMethod === "credit" && selectedCustomer) {
        const creditAmount = isPartialPayment ? 
          total - parseFloat(partialAmount) : 
          total;
        const newCreditBalance = (selectedCustomer.creditBalance || 0) + creditAmount;
        
        // Create credit agreement for ALL credit transactions
        const updateData: any = {
          creditBalance: newCreditBalance,
        };

        // Determine agreement parameters
        let agreementData;
        if (isPartialPayment && paymentTerms) {
          // Partial payment with custom terms
          const terms = parseInt(paymentTerms);
          const remainingBalance = total - parseFloat(partialAmount);
          const monthlyAmount = remainingBalance / terms;
          const startDate = new Date();
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + terms);
          const nextPaymentDue = new Date();
          nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

          agreementData = {
            principalAmount: remainingBalance,
            remainingBalance: remainingBalance,
            monthlyPayment: monthlyAmount,
            totalTerms: terms,
            remainingTerms: terms,
            startDate: Timestamp.fromDate(startDate),
            dueDate: Timestamp.fromDate(dueDate),
            nextPaymentDue: Timestamp.fromDate(nextPaymentDue),
            status: 'active' as const,
            paymentHistory: [],
            createdAt: Timestamp.now(),
          };
        } else {
          // Full credit sale (default 30-day terms)
          const startDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30); // 30 days default
          const nextPaymentDue = new Date();
          nextPaymentDue.setDate(nextPaymentDue.getDate() + 30);

          agreementData = {
            principalAmount: total,
            remainingBalance: total,
            monthlyPayment: total, // Full amount due in one payment
            totalTerms: 1,
            remainingTerms: 1,
            startDate: Timestamp.fromDate(startDate),
            dueDate: Timestamp.fromDate(dueDate),
            nextPaymentDue: Timestamp.fromDate(nextPaymentDue),
            status: 'active' as const,
            paymentHistory: [],
            createdAt: Timestamp.now(),
          };
        }

        // Create a document in the creditAgreements collection
        const creditAgreementDocData: CreateCreditAgreement = {
          ...agreementData,
          // saleId is omitted since it's optional and we don't have a valid DocumentReference yet
        };

        // Add the document to the creditAgreements collection
        const creditAgreementDoc = await addDoc(collection(db, "creditAgreements"), creditAgreementDocData);
        
        // Add the Firestore document ID to the agreement data
        const agreementWithId = {
          ...agreementData,
          id: creditAgreementDoc.id,
        };

        // Add to existing credit agreements in customer document
        const existingAgreements = selectedCustomer.creditAgreements || [];
        updateData.creditAgreements = [...existingAgreements, agreementWithId];

        await updateDoc(doc(db, "customers", selectedCustomer.id), updateData);
      }

      // Show success message
      if (paymentMethod === "cash" && paidAmount > total) {
        const change = paidAmount - total;
        alert(`Sale completed successfully!\nChange: ₱${change.toFixed(2)}`);
      } else if (paymentMethod === "credit" && isPartialPayment) {
        const remainingBalance = total - parseFloat(partialAmount);
        alert(`Sale completed successfully!\nPartial payment: ₱${parseFloat(partialAmount).toFixed(2)}\nRemaining balance: ₱${remainingBalance.toFixed(2)}\nMonthly payment: ₱${monthlyPayment.toFixed(2)} for ${paymentTerms} months\nCredit agreement created successfully!`);
      } else if (paymentMethod === "credit") {
        alert(`Credit sale completed successfully!\nTotal amount: ₱${total.toFixed(2)}\nDue date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}\nCredit agreement created successfully!`);
      } else {
        alert("Sale completed successfully!");
      }

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
          </div>{" "}
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
                <button
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  ×
                </button>
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
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "credit")
                    }
                  />
                  Credit
                </label>
              </div>
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

            {/* Partial Payment Section */}
            {paymentMethod === "credit" && selectedCustomer && (
              <div className="partial-payment-section">
                <div className="partial-payment-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={isPartialPayment}
                      onChange={(e) => setIsPartialPayment(e.target.checked)}
                    />
                    Enable partial payment with custom terms
                  </label>
                </div>

                {isPartialPayment && (
                  <div className="partial-payment-details">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Partial Payment Amount:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={total}
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          placeholder="Enter partial payment amount"
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms (months):</label>
                        <select
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                        >
                          <option value="1">1 month</option>
                          <option value="2">2 months</option>
                          <option value="3">3 months</option>
                          <option value="6">6 months</option>
                          <option value="12">12 months</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    {paymentTerms === "custom" && (
                      <div className="form-group">
                        <label>Custom Terms (months):</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={paymentTerms === "custom" ? "" : paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          placeholder="Enter number of months"
                        />
                      </div>
                    )}

                    {monthlyPayment > 0 && (
                      <div className="payment-breakdown">
                        <h4>Payment Breakdown:</h4>
                        <div className="breakdown-item">
                          <span>Partial Payment Now:</span>
                          <span>₱{parseFloat(partialAmount || "0").toFixed(2)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Remaining Balance:</span>
                          <span>₱{(total - parseFloat(partialAmount || "0")).toFixed(2)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Monthly Payment:</span>
                          <span>₱{monthlyPayment.toFixed(2)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Payment Terms:</span>
                          <span>{paymentTerms} months</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Process Sale Button */}            <button
              className="process-sale-btn"
              onClick={processSale}
              disabled={cart.length === 0}
            >
              Process Sale
            </button>          </div>
        </div>
      </div>      )}

      {/* Credit Payments Section */}
      {currentSection === "credit-payments" && (
        <div className="pos-content-section">
          <div className="section-header">
            <h2>Credit Payments</h2>
            <p>Process payments for credit sales</p>
          </div>

          <div className="credit-payment-container">
            {/* Credit Payment Form */}
            <div className="credit-payment-form">
              <div className="form-grid">
                {/* Customer Selection */}
                <div className="form-group">
                  <label>Customer with Outstanding Balance:</label>
                  <select
                    value={selectedCreditCustomer?.id || ""}
                    onChange={(e) => {
                      const customer = customersWithCredit.find(c => c.id === e.target.value);
                      console.log("Selected customer:", customer);
                      console.log("Customer credit agreements:", customer?.creditAgreements);
                      console.log("Number of credit agreements:", customer?.creditAgreements?.length || 0);
                      setSelectedCreditCustomer(customer || null);
                    }}
                  >
                    <option value="">Select customer...</option>
                    {customersWithCredit.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - Outstanding: ₱{(customer.creditBalance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCreditCustomer && (
                  <>
                    <div className="outstanding-balance">
                      <h3>Outstanding Balance: ₱{(selectedCreditCustomer.creditBalance || 0).toFixed(2)}</h3>
                    </div>

                    <div className="form-group">
                      <label>Payment Amount:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedCreditCustomer.creditBalance || 0}
                        value={creditPaymentAmount}
                        onChange={(e) => setCreditPaymentAmount(e.target.value)}
                        placeholder="Enter payment amount"
                      />
                    </div>

                    <div className="form-group">
                      <label>Payment Method:</label>
                      <div className="payment-options">
                        <label>
                          <input
                            type="radio"
                            value="cash"
                            checked={creditPaymentMethod === "cash"}
                            onChange={(e) => setCreditPaymentMethod(e.target.value as "cash")}
                          />
                          Cash
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="gcash"
                            checked={creditPaymentMethod === "gcash"}
                            onChange={(e) => setCreditPaymentMethod(e.target.value as "gcash")}
                          />
                          GCash
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="transfer"
                            checked={creditPaymentMethod === "transfer"}
                            onChange={(e) => setCreditPaymentMethod(e.target.value as "transfer")}
                          />
                          Bank Transfer
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="check"
                            checked={creditPaymentMethod === "check"}
                            onChange={(e) => setCreditPaymentMethod(e.target.value as "check")}
                          />
                          Check
                        </label>
                      </div>
                    </div>

                    {(creditPaymentMethod === "gcash" || creditPaymentMethod === "transfer" || creditPaymentMethod === "check") && (
                      <div className="form-group">
                        <label>
                          {creditPaymentMethod === "gcash" ? "GCash Reference:" : 
                           creditPaymentMethod === "transfer" ? "Transfer Reference:" : 
                           "Check Number:"}
                        </label>
                        <input
                          type="text"
                          value={creditPaymentReference}
                          onChange={(e) => setCreditPaymentReference(e.target.value)}
                          placeholder={`Enter ${creditPaymentMethod === "gcash" ? "GCash reference" : 
                                                creditPaymentMethod === "transfer" ? "transfer reference" : 
                                                "check number"}`}
                        />
                      </div>
                    )}

                    <button
                      className="process-payment-btn"
                      onClick={processCreditPayment}
                      disabled={!creditPaymentAmount || parseFloat(creditPaymentAmount) <= 0}
                    >
                      Process Payment
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Credit Information Card */}
            <div className="credit-info-card">
              <h3>Credit Information</h3>
              {selectedCreditCustomer ? (
                <div>
                  {/* Customer Summary */}
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#2c3e50', fontSize: '16px' }}>Customer:</strong> 
                      <span style={{ fontSize: '16px', marginLeft: '8px' }}>{selectedCreditCustomer.name}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#2c3e50' }}>Contact:</strong> 
                      <span style={{ marginLeft: '8px' }}>{selectedCreditCustomer.contact || 'N/A'}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#2c3e50' }}>Join Date:</strong> 
                      <span style={{ marginLeft: '8px' }}>
                        {selectedCreditCustomer.joinDate ? 
                          selectedCreditCustomer.joinDate.toDate().toLocaleDateString() : 
                          'N/A'
                        }
                      </span>
                    </div>
                    {selectedCreditCustomer.lastPaymentDate && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#2c3e50' }}>Last Payment:</strong> 
                        <span style={{ marginLeft: '8px' }}>
                          {selectedCreditCustomer.lastPaymentDate.toDate().toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Credit Summary */}
                  <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    border: '1px solid #1976d2'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                        Total Outstanding Balance
                      </span>
                      <span style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#d32f2f',
                        backgroundColor: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px'
                      }}>
                        ₱{(selectedCreditCustomer.creditBalance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Active Agreements:</strong></span>
                      <span>{selectedCreditCustomer.creditAgreements?.filter(a => a.status === 'active').length || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Completed Agreements:</strong></span>
                      <span>{selectedCreditCustomer.creditAgreements?.filter(a => a.status === 'completed').length || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Total Agreements:</strong></span>
                      <span>{selectedCreditCustomer.creditAgreements?.length || 0}</span>
                    </div>
                  </div>
                  
                  {/* Credit Agreements Details */}
                  {selectedCreditCustomer.creditAgreements && selectedCreditCustomer.creditAgreements.length > 0 ? (
                    <div>
                      <h4 style={{ 
                        marginBottom: '15px', 
                        color: '#2c3e50',
                        borderBottom: '2px solid #e9ecef',
                        paddingBottom: '8px'
                      }}>
                        Credit Agreements Details
                      </h4>
                      
                      {/* Active Agreements */}
                      {selectedCreditCustomer.creditAgreements.filter(a => a.status === 'active').length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ color: '#27ae60', marginBottom: '10px' }}>
                            🟢 Active Agreements ({selectedCreditCustomer.creditAgreements.filter(a => a.status === 'active').length})
                          </h5>
                          {selectedCreditCustomer.creditAgreements
                            .filter(agreement => agreement.status === 'active')
                            .sort((a, b) => a.startDate.toDate().getTime() - b.startDate.toDate().getTime())
                            .map((agreement, index) => {
                              const agreementKey = agreement.id || `active-${index}`;
                              const isExpanded = expandedAgreements.has(agreementKey);
                              
                              return (
                                <div key={agreementKey} style={{ 
                                  backgroundColor: '#e8f5e8', 
                                  borderRadius: '12px', 
                                  marginBottom: '15px',
                                  border: '2px solid #27ae60',
                                  boxShadow: '0 2px 8px rgba(39, 174, 96, 0.1)',
                                  overflow: 'hidden'
                                }}>
                                  {/* Collapsible Header */}
                                  <div 
                                    onClick={() => toggleAgreementExpansion(agreementKey)}
                                    style={{ 
                                      padding: '15px 20px',
                                      cursor: 'pointer',
                                      backgroundColor: '#d4edda',
                                      borderBottom: isExpanded ? '1px solid #c8e6c9' : 'none',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c3e6cb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d4edda'}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: '5px' }}>
                                          Credit Agreement #{index + 1}
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#666' }}>
                                          <span><strong>Amount:</strong> ₱{agreement.principalAmount.toFixed(2)}</span>
                                          <span><strong>Remaining:</strong> ₱{agreement.remainingBalance.toFixed(2)}</span>
                                          <span><strong>Monthly:</strong> ₱{agreement.monthlyPayment.toFixed(2)}</span>
                                          <span><strong>Terms Left:</strong> {agreement.remainingTerms} months</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{
                                        backgroundColor: '#27ae60',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>
                                        {agreement.status.toUpperCase()}
                                      </span>
                                      
                                      <div style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: '#27ae60',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease'
                                      }}>
                                        ▼
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expandable Content */}
                                  {isExpanded && (
                                    <div style={{ padding: '20px' }}>
                                      {agreement.id && (
                                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }}>
                                          Document ID: {agreement.id}
                                        </div>
                                      )}

                                      {/* Financial Information */}
                                      <div style={{ 
                                        backgroundColor: '#f8fff8', 
                                        padding: '15px', 
                                        borderRadius: '8px', 
                                        marginBottom: '15px',
                                        border: '1px solid #c8e6c9'
                                      }}>
                                        <h6 style={{ 
                                          margin: '0 0 10px 0', 
                                          color: '#27ae60', 
                                          fontSize: '14px',
                                          fontWeight: 'bold'
                                        }}>
                                          💰 Financial Details
                                        </h6>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                          <div style={{ 
                                            padding: '8px', 
                                            backgroundColor: 'white', 
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                          }}>
                                            <strong style={{ color: '#2c3e50' }}>Principal Amount</strong>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60', marginTop: '2px' }}>
                                              ₱{agreement.principalAmount.toFixed(2)}
                                            </div>
                                          </div>
                                          <div style={{ 
                                            padding: '8px', 
                                            backgroundColor: 'white', 
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                          }}>
                                            <strong style={{ color: '#2c3e50' }}>Remaining Balance</strong>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e74c3c', marginTop: '2px' }}>
                                              ₱{agreement.remainingBalance.toFixed(2)}
                                            </div>
                                          </div>
                                          <div style={{ 
                                            padding: '8px', 
                                            backgroundColor: 'white', 
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                          }}>
                                            <strong style={{ color: '#2c3e50' }}>Monthly Payment</strong>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3498db', marginTop: '2px' }}>
                                              ₱{agreement.monthlyPayment.toFixed(2)}
                                            </div>
                                          </div>
                                          <div style={{ 
                                            padding: '8px', 
                                            backgroundColor: 'white', 
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                          }}>
                                            <strong style={{ color: '#2c3e50' }}>Amount Paid</strong>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60', marginTop: '2px' }}>
                                              ₱{(agreement.principalAmount - agreement.remainingBalance).toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Payment Terms */}
                                      <div style={{ 
                                        backgroundColor: '#f0f8ff', 
                                        padding: '15px', 
                                        borderRadius: '8px', 
                                        marginBottom: '15px',
                                        border: '1px solid #b3d9ff'
                                      }}>
                                        <h6 style={{ 
                                          margin: '0 0 10px 0', 
                                          color: '#3498db', 
                                          fontSize: '14px',
                                          fontWeight: 'bold'
                                        }}>
                                          📅 Payment Terms
                                        </h6>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                          <div><strong>Total Terms:</strong> {agreement.totalTerms} months</div>
                                          <div><strong>Remaining Terms:</strong> {agreement.remainingTerms} months</div>
                                          <div><strong>Terms Completed:</strong> {agreement.totalTerms - agreement.remainingTerms} months</div>
                                          <div><strong>Payments Made:</strong> {agreement.paymentHistory.length}</div>
                                        </div>
                                      </div>

                                      {/* Important Dates */}
                                      <div style={{ 
                                        backgroundColor: '#fff8e1', 
                                        padding: '15px', 
                                        borderRadius: '8px', 
                                        marginBottom: '15px',
                                        border: '1px solid #ffd54f'
                                      }}>
                                        <h6 style={{ 
                                          margin: '0 0 10px 0', 
                                          color: '#f57c00', 
                                          fontSize: '14px',
                                          fontWeight: 'bold'
                                        }}>
                                          📆 Important Dates
                                        </h6>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                          <div>
                                            <strong>Agreement Start:</strong>
                                            <div style={{ marginTop: '2px', color: '#666' }}>
                                              {agreement.startDate.toDate().toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                              })}
                                            </div>
                                          </div>
                                          <div>
                                            <strong>Due Date:</strong>
                                            <div style={{ marginTop: '2px', color: '#666' }}>
                                              {agreement.dueDate.toDate().toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                              })}
                                            </div>
                                          </div>
                                          <div>
                                            <strong>Next Payment Due:</strong>
                                            <div style={{ 
                                              marginTop: '2px', 
                                              color: agreement.nextPaymentDue.toDate() <= new Date() ? '#e74c3c' : '#666',
                                              fontWeight: agreement.nextPaymentDue.toDate() <= new Date() ? 'bold' : 'normal'
                                            }}>
                                              {agreement.nextPaymentDue.toDate().toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                              })}
                                              {agreement.nextPaymentDue.toDate() <= new Date() && (
                                                <span style={{ 
                                                  marginLeft: '5px', 
                                                  backgroundColor: '#e74c3c', 
                                                  color: 'white', 
                                                  padding: '2px 6px', 
                                                  borderRadius: '3px', 
                                                  fontSize: '10px' 
                                                }}>
                                                  OVERDUE
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {agreement.createdAt && (
                                            <div>
                                              <strong>Created:</strong>
                                              <div style={{ marginTop: '2px', color: '#666' }}>
                                                {agreement.createdAt.toDate().toLocaleDateString('en-US', { 
                                                  year: 'numeric', 
                                                  month: 'long', 
                                                  day: 'numeric' 
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      <div style={{ marginBottom: '15px' }}>
                                        <div style={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          marginBottom: '8px',
                                          fontSize: '12px'
                                        }}>
                                          <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Payment Progress</span>
                                          <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                                            {((agreement.principalAmount - agreement.remainingBalance) / agreement.principalAmount * 100).toFixed(1)}% Complete
                                          </span>
                                        </div>
                                        <div style={{ 
                                          backgroundColor: '#e0e0e0', 
                                          borderRadius: '8px', 
                                          height: '12px',
                                          overflow: 'hidden',
                                          position: 'relative'
                                        }}>
                                          <div style={{ 
                                            backgroundColor: '#27ae60', 
                                            height: '100%',
                                            width: `${(agreement.principalAmount - agreement.remainingBalance) / agreement.principalAmount * 100}%`,
                                            transition: 'width 0.3s ease',
                                            borderRadius: '8px'
                                          }}></div>
                                          <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                          }}>
                                            ₱{(agreement.principalAmount - agreement.remainingBalance).toFixed(0)} / ₱{agreement.principalAmount.toFixed(0)}
                                          </div>
                                        </div>
                                      </div>

                                {/* Monthly Payment Schedule */}
                                {agreement.remainingTerms > 0 && agreement.monthlyPayment > 0 && (
                                  <div style={{ 
                                    backgroundColor: '#fff8e1', 
                                    padding: '15px', 
                                    borderRadius: '8px', 
                                    marginBottom: '15px',
                                    border: '1px solid #ffc107'
                                  }}>
                                    <h6 style={{ 
                                      margin: '0 0 15px 0', 
                                      color: '#f57c00', 
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}>
                                      📅 Monthly Payment Schedule
                                    </h6>
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                      gap: '8px',
                                      maxHeight: '200px',
                                      overflowY: 'auto'
                                    }}>
                                      {(() => {
                                        const schedule = [];
                                        const startDate = new Date(agreement.nextPaymentDue.toDate());
                                        
                                        for (let i = 0; i < Math.min(agreement.remainingTerms, 12); i++) {
                                          const paymentDate = new Date(startDate);
                                          paymentDate.setMonth(paymentDate.getMonth() + i);
                                          
                                          const isOverdue = paymentDate <= new Date();
                                          const isPaid = i < (agreement.totalTerms - agreement.remainingTerms);
                                          
                                          schedule.push(
                                            <div key={i} style={{
                                              padding: '8px',
                                              backgroundColor: isPaid ? '#e8f5e8' : isOverdue ? '#ffebee' : 'white',
                                              borderRadius: '6px',
                                              border: `2px solid ${isPaid ? '#4caf50' : isOverdue ? '#f44336' : '#e0e0e0'}`,
                                              fontSize: '11px',
                                              textAlign: 'center',
                                              position: 'relative'
                                            }}>
                                              {isPaid && (
                                                <div style={{
                                                  position: 'absolute',
                                                  top: '-5px',
                                                  right: '-5px',
                                                  backgroundColor: '#4caf50',
                                                  color: 'white',
                                                  borderRadius: '50%',
                                                  width: '16px',
                                                  height: '16px',
                                                  fontSize: '10px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                                }}>
                                                  ✓
                                                </div>
                                              )}
                                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                                {paymentDate.toLocaleDateString('en-US', { 
                                                  month: 'short', 
                                                  day: 'numeric' 
                                                })}
                                              </div>
                                              <div style={{ 
                                                color: isPaid ? '#4caf50' : isOverdue ? '#f44336' : '#2c3e50',
                                                fontWeight: 'bold'
                                              }}>
                                                ₱{agreement.monthlyPayment.toFixed(0)}
                                              </div>
                                              {isOverdue && !isPaid && (
                                                <div style={{
                                                  backgroundColor: '#f44336',
                                                  color: 'white',
                                                  padding: '1px 4px',
                                                  borderRadius: '3px',
                                                  fontSize: '8px',
                                                  marginTop: '2px'
                                                }}>
                                                  OVERDUE
                                                </div>
                                              )}
                                              {isPaid && (
                                                <div style={{
                                                  backgroundColor: '#4caf50',
                                                  color: 'white',
                                                  padding: '1px 4px',
                                                  borderRadius: '3px',
                                                  fontSize: '8px',
                                                  marginTop: '2px'
                                                }}>
                                                  PAID
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        
                                        return schedule;
                                      })()}
                                    </div>
                                    {agreement.remainingTerms > 12 && (
                                      <div style={{
                                        textAlign: 'center',
                                        fontSize: '10px',
                                        color: '#666',
                                        marginTop: '8px',
                                        fontStyle: 'italic'
                                      }}>
                                        ... and {agreement.remainingTerms - 12} more monthly payments of ₱{agreement.monthlyPayment.toFixed(0)}
                                      </div>
                                    )}
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      marginTop: '10px',
                                      padding: '8px',
                                      backgroundColor: '#fff',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      border: '1px solid #e0e0e0'
                                    }}>
                                      <span><strong>Total Remaining:</strong> ₱{(agreement.monthlyPayment * agreement.remainingTerms).toFixed(2)}</span>
                                      <span><strong>Next Due:</strong> {agreement.nextPaymentDue.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Action Summary */}
                                <div style={{ 
                                  backgroundColor: '#f8f9fa', 
                                  padding: '10px', 
                                  borderRadius: '6px',
                                  border: '1px solid #e9ecef',
                                  fontSize: '11px',
                                  color: '#666'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>
                                      <strong>Payment History:</strong> {agreement.paymentHistory.length} payment(s) made
                                    </span>
                                    {agreement.notes && (
                                      <span style={{ fontStyle: 'italic' }}>
                                        Note: {agreement.notes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Completed Agreements */}
                      {selectedCreditCustomer.creditAgreements.filter(a => a.status === 'completed').length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ color: '#1976d2', marginBottom: '10px' }}>
                            ✅ Completed Agreements ({selectedCreditCustomer.creditAgreements.filter(a => a.status === 'completed').length})
                          </h5>
                          {selectedCreditCustomer.creditAgreements
                            .filter(agreement => agreement.status === 'completed')
                            .sort((a, b) => b.dueDate.toDate().getTime() - a.dueDate.toDate().getTime())
                            .slice(0, 3) // Show only last 3 completed agreements
                            .map((agreement, index) => (
                              <div key={agreement.id || index} style={{ 
                                padding: '12px', 
                                backgroundColor: '#e3f2fd', 
                                borderRadius: '6px', 
                                marginBottom: '8px',
                                border: '1px solid #1976d2',
                                fontSize: '11px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <span style={{ fontWeight: 'bold' }}>Agreement (Completed)</span>
                                  <span style={{
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    fontSize: '9px'
                                  }}>
                                    COMPLETED
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                  <div><strong>Amount:</strong> ₱{agreement.principalAmount.toFixed(2)}</div>
                                  <div><strong>Payments Made:</strong> {agreement.paymentHistory.length}</div>
                                  <div><strong>Start:</strong> {agreement.startDate.toDate().toLocaleDateString()}</div>
                                  <div><strong>Completed:</strong> {agreement.dueDate.toDate().toLocaleDateString()}</div>
                                </div>
                              </div>
                            ))}
                          {selectedCreditCustomer.creditAgreements.filter(a => a.status === 'completed').length > 3 && (
                            <div style={{ 
                              textAlign: 'center', 
                              fontSize: '11px', 
                              color: '#666',
                              fontStyle: 'italic',
                              marginTop: '5px'
                            }}>
                              ... and {selectedCreditCustomer.creditAgreements.filter(a => a.status === 'completed').length - 3} more completed agreements
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      No credit agreements found for this customer
                    </div>
                  )}
                  
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    marginTop: '20px',
                    border: '1px solid #ffc107'
                  }}>
                    💡 <strong>Payment Allocation:</strong> Payments are automatically applied to the oldest active credit agreements first. Each payment reduces the remaining balance and updates the agreement status accordingly.
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  color: '#666', 
                  fontStyle: 'italic',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px dashed #e9ecef'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>📋</div>
                  <div style={{ fontSize: '16px', marginBottom: '5px' }}>No Customer Selected</div>
                  <div style={{ fontSize: '14px' }}>Select a customer above to view their credit information and agreement details</div>
                </div>
              )}
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
    </div>
  );
};

export default POS;
