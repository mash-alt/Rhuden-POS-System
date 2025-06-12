import { useState, useEffect } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import useProducts from "../hooks/useProducts";
import useCustomers from "../hooks/useCustomers";
import useSales from "../hooks/useSales";
import { usePayments } from "../hooks/usePayments";
import type { Product, Customer, Sale } from "../types";
import "../styles/POS.css";

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

const POS = () => {
  const { products, loading: productsLoading, updateProduct } = useProducts();
  const { customers, loading: customersLoading, addCustomer } = useCustomers();
  const { addSale, getTodaysSales, getTotalSalesAmount, sales } = useSales();
  const { addPayment } = usePayments();

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
  const [newCustomerName, setNewCustomerName] = useState("");  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  
  // Credit payment state
  const [showCreditPayment, setShowCreditPayment] = useState(false);
  const [creditPaymentAmount, setCreditPaymentAmount] = useState<string>("");
  const [creditPaymentMethod, setCreditPaymentMethod] = useState<"cash" | "gcash" | "transfer" | "check">("cash");
  const [creditPaymentReference, setCreditPaymentReference] = useState("");
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<Customer | null>(null);  // Filter products based on search (only show active products)
  const filteredProducts = products.filter(
    (product) =>
      product.active &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get customers with outstanding credit balance
  const customersWithCredit = customers.filter(customer => (customer.creditBalance || 0) > 0);

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(newTotal);
  }, [cart]);

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
      });
      setNewCustomerName("");
      setNewCustomerContact("");
      setShowCustomerForm(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer!");
    }
  };

  // Process credit payment
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
      alert("GCash reference number is required!");
      return;
    }

    try {
      // Find the most recent unpaid sale for this customer
      const customerSales = sales
        .filter(sale => sale.customerId?.id === selectedCreditCustomer.id && sale.paymentMethod === 'credit')
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
      await addPayment(paymentData);

      // Update customer credit balance
      const newCreditBalance = (selectedCreditCustomer.creditBalance || 0) - paymentAmount;
      await updateDoc(doc(db, "customers", selectedCreditCustomer.id), {
        creditBalance: newCreditBalance,
      });

      alert(`Payment of ₱${paymentAmount.toFixed(2)} processed successfully!`);
      
      // Clear credit payment form
      setSelectedCreditCustomer(null);
      setCreditPaymentAmount("");
      setCreditPaymentReference("");
      setShowCreditPayment(false);
    } catch (error) {
      console.error("Error processing credit payment:", error);
      alert("Failed to process payment!");
    }
  };

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

    const paidAmount =
      paymentMethod === "cash" ? parseFloat(amountPaid) || total : total;

    if (paymentMethod === "cash" && paidAmount < total) {
      alert("Insufficient payment amount!");
      return;
    }

    try {      // Prepare sale data
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

      // Add credit-specific fields only for credit sales
      if (paymentMethod === "credit") {
        saleData.creditStatus = "pending";
        saleData.amountPaid = 0;
        saleData.dueDate = Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        );
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
        const newCreditBalance = (selectedCustomer.creditBalance || 0) + total;
        await updateDoc(doc(db, "customers", selectedCustomer.id), {
          creditBalance: newCreditBalance,
        });
      }

      // Show success message and change
      if (paymentMethod === "cash" && paidAmount > total) {
        const change = paidAmount - total;
        alert(`Sale completed successfully!\nChange: ₱${change.toFixed(2)}`);
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

            {/* Process Sale Button */}
            <button
              className="process-sale-btn"
              onClick={processSale}
              disabled={cart.length === 0}
            >
              Process Sale
            </button>
          </div>        </div>
      </div>

      {/* Credit Payment Section */}
      <div className="pos-credit-payment">
        <div className="credit-payment-header">
          <h2>Credit Payments</h2>
          <button 
            className="toggle-credit-payment-btn"
            onClick={() => setShowCreditPayment(!showCreditPayment)}
          >
            {showCreditPayment ? 'Hide' : 'Show'} Credit Payments
          </button>
        </div>

        {showCreditPayment && (
          <div className="credit-payment-form">
            <div className="customer-with-credit-section">
              <label>Customer with Outstanding Balance:</label>
              <select
                value={selectedCreditCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customersWithCredit.find(c => c.id === e.target.value);
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

                <div className="credit-payment-amount">
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

                <div className="credit-payment-method">
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
                  <div className="credit-payment-reference">
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
                  className="process-credit-payment-btn"
                  onClick={processCreditPayment}
                  disabled={!creditPaymentAmount || parseFloat(creditPaymentAmount) <= 0}
                >
                  Process Payment
                </button>
              </>
            )}
          </div>
        )}
      </div>

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
