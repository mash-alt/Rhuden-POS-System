import { useState, useEffect } from "react";
import { useSales } from "../hooks/useSales";
import { usePayments } from "../hooks/usePayments";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import "../styles/TransactionHistory.css";
import "../styles/table-enhancements.css";
import "../styles/table-responsive.css";
import "../styles/table-header-lines.css";
import "../styles/discount-info.css";
import "../styles/cod-details.css";

interface Transaction {
  id: string;
  type: "sale" | "credit_payment";
  saleId: string;
  creditAgreementId?: string;
  date: Date;
  customerName: string;
  totalAmount: number;
  originalTotal?: number; // Original total before discounts
  discountTotal?: number; // Total discount amount
  paidAmount: number;
  outstandingAmount: number;
  description: string;
  status: "paid" | "partial" | "pending";
  paymentMethod: string;
  isCOD?: boolean;
  deliveryAddress?: string; // Address for COD deliveries
  deliveryDate?: Date;
  payments: Array<{
    id: string;
    amount: number;
    date: Date;
    method: string;
    referenceCode?: string;
  }>;
}

const TransactionHistory = () => {
  const { sales } = useSales();
  const { payments } = usePayments();
  const { customers } = useCustomers();
  const { products } = useProducts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); // New state for transaction type filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // State for COD modal
  const [selectedCODTransaction, setSelectedCODTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    // Debug logging to see all sales and payments
    console.log('--- DEBUG TRANSACTION HISTORY ---');
    console.log('Total Sales Records:', sales.length);
    console.log('Total Payment Records:', payments.length);
    
    // Special debug for COD transactions
    const codSales = sales.filter(sale => sale.isCOD === true);
    console.log('\n📦 COD TRANSACTIONS IN FIRESTORE:', codSales.length);
    
    if (codSales.length > 0) {
      console.log('Found COD Transactions:');
      codSales.forEach((sale, idx) => {
        console.log(`${idx + 1}. Sale ID: ${sale.id}`);
        console.log(`   Customer: ${sale.customerId?.id || 'Unknown'}`);
        console.log(`   Delivery Address: ${sale.deliveryAddress || 'Not specified'}`);
        console.log(`   Delivery Date: ${sale.deliveryDate ? sale.deliveryDate.toDate().toLocaleString() : 'Not scheduled'}`);
        console.log(`   Total Amount: ${sale.total}`);
        console.log(`   Raw isCOD value:`, sale.isCOD);
        console.log(`   Raw data:`, sale);
      });
    } else {
      console.log('⚠️ No COD transactions found in sales data');
    }

    // Log all sales
    console.log('SALES DATA:');
    sales.forEach((sale, index) => {
      console.log(`Sale ${index + 1} (ID: ${sale.id}):`);
      console.log('  Total Amount:', sale.total);
      console.log('  Payment Method:', sale.paymentMethod);
      console.log('  Credit Status:', sale.creditStatus || 'N/A');
      console.log('  Amount Paid:', sale.amountPaid || 0);
      console.log('  Date:', sale.date.toDate());
      console.log('  Items Count:', sale.items.length);
      
      // Log COD specific information if applicable
      if (sale.isCOD) {
        console.log('  🚚 COD TRANSACTION:');
        console.log('    Delivery Address:', sale.deliveryAddress || 'Not specified');
        console.log('    Delivery Date:', sale.deliveryDate ? sale.deliveryDate.toDate() : 'Not scheduled');
      }
    });

    // Log all payments
    console.log('PAYMENTS DATA:');
    payments.forEach((payment, index) => {
      console.log(`Payment ${index + 1} (ID: ${payment.id}):`);
      console.log('  Amount:', payment.amount);
      console.log('  Payment Type:', payment.paymentType);
      console.log('  Payment Method:', payment.paymentMethod);
      console.log('  Sale ID:', payment.saleId?.id || 'N/A');
      console.log('  Credit Agreement ID:', payment.creditAgreementId || 'N/A');
      console.log('  Date:', payment.date.toDate());
    });

    const allTransactions: Transaction[] = [];

    // Create transactions from sales with their associated payments
    sales.forEach((sale) => {
      const customerId = sale.customerId?.id;
      const customer = customers.find((c) => c.id === customerId);

      // Find all payments for this sale
      const salePayments = payments.filter(
        (payment) => payment.saleId?.id === sale.id && payment.paymentType === 'sale'
      );      
      
      // Calculate total paid amount for the initial sale
      const totalPaid = salePayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      
      // For credit sales, use the sum of payments
      // For cash and gcash payments, use the sale's total amount as the paid amount (not amountPaid which includes change)
      // This ensures we don't include the change amount in the actual payment calculation
      let actualPaidAmount;
      if (sale.paymentMethod === 'credit') {
        actualPaidAmount = totalPaid;
      } else if (sale.paymentMethod === 'cash') {
        // For cash payments that are fully paid, use the sale's total amount
        // This avoids counting the change as part of the payment
        actualPaidAmount = sale.total;
      } else {
        // For other payment methods (like gcash), use the amountPaid field
        actualPaidAmount = sale.amountPaid || 0;
      }
      
      const outstanding = sale.total - actualPaidAmount;

      // Determine status based on payment amounts
      let status: "paid" | "partial" | "pending";
      if (actualPaidAmount >= sale.total) {
        status = "paid";
      } else if (actualPaidAmount > 0) {
        status = "partial";
      } else {
        status = "pending";
      }
      
      // Get item names for description with discount information
      const itemNames = sale.items
        .map(item => {
          const product = products.find(p => p.id === item.productId.id);
          const productName = product ? product.name : "Unknown Item";
          
          // Add discount info to item description if available
          let discountInfo = "";
          if (item.discountAmount || item.discountPercent) {
            if (item.discountPercent) {
              discountInfo = ` (-${item.discountPercent}%)`;
            } else if (item.discountAmount && item.originalPrice) {
              const discountPercent = Math.round((item.discountAmount / item.originalPrice) * 100);
              discountInfo = ` (-₱${item.discountAmount.toFixed(2)}/${discountPercent}%)`;
            }
          }
          
          return `${productName}${discountInfo} (${item.qty})`;
        })
        .join(', ');

      // Calculate change amount for cash payments
      let changeAmount = 0;
      if (sale.paymentMethod === 'cash' && (sale.amountPaid || 0) > sale.total) {
        changeAmount = (sale.amountPaid || 0) - sale.total;
      }

      // Add explanation of cash payment with change for clarity
      let paymentDescription = '';
      if (sale.paymentMethod === 'cash' && changeAmount > 0) {
        paymentDescription = ` (Tendered: ₱${(sale.amountPaid || 0).toFixed(2)}, Change: ₱${changeAmount.toFixed(2)})`;
      }
      
      // Add COD information if present
      if (sale.isCOD) {
        const deliveryDate = sale.deliveryDate ? 
          sale.deliveryDate.toDate().toLocaleDateString() : 
          'Not scheduled';
        paymentDescription += ` [COD Delivery: ${deliveryDate}]`;
      }

      // Create discount description
      let discountDescription = '';
      if (sale.discountTotal && sale.discountTotal > 0) {
        const discountPercent = Math.round((sale.discountTotal / (sale.originalTotal || sale.total)) * 100);
        discountDescription = ` (Total Discount: ₱${sale.discountTotal.toFixed(2)}/${discountPercent}%)`;
      }

      // Debug the sale object before converting to a transaction
      if (sale.isCOD) {
        console.log('🧩 Converting COD sale to transaction:', {
          id: sale.id,
          isCOD: sale.isCOD,
          deliveryAddress: sale.deliveryAddress,
          deliveryDate: sale.deliveryDate ? sale.deliveryDate.toDate() : undefined
        });
      }
      
      allTransactions.push({
        id: sale.id,
        type: "sale",
        saleId: sale.id,
        date: sale.date.toDate(),        
        customerName: customer?.name || "Walk-in Customer",
        totalAmount: sale.total,
        originalTotal: sale.originalTotal || sale.total, // Use originalTotal if available, otherwise use total
        discountTotal: sale.discountTotal || 0, // Use discountTotal if available, otherwise use 0
        paidAmount: actualPaidAmount,
        outstandingAmount: outstanding,
        description: `${itemNames}${discountDescription}${paymentDescription}`,
        status: status,
        paymentMethod: sale.paymentMethod,
        // Explicitly convert and handle COD fields
        isCOD: sale.isCOD === true, // Ensure boolean conversion
        deliveryAddress: sale.deliveryAddress || '',
        deliveryDate: sale.deliveryDate ? sale.deliveryDate.toDate() : undefined,
        payments: salePayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          date: payment.date.toDate(),
          method: payment.paymentMethod,
          referenceCode:
            payment.referenceCode ||
            payment.gcashReferenceNumber ||
            payment.checkNumber,
        })),
      });
    });
    
    // Add credit payment transactions (separate from sales)
    const creditPayments = payments.filter(payment => 
      payment.paymentType === 'credit_payment'
    );
    
    creditPayments.forEach((payment, index) => {
      const customerId = payment.customerId?.id;
      const customer = customers.find(c => c.id === customerId);
      const saleId = payment.saleId?.id;
      const relatedSale = saleId ? sales.find(s => s.id === saleId) : null;
      const creditAgreementId = payment.creditAgreementId;
      
      console.log(`Processing credit payment ${index + 1} (ID: ${payment.id}):`);
      console.log('  Customer:', customer?.name || 'Unknown');
      console.log('  Related Sale ID:', relatedSale?.id || 'None');
      console.log('  Credit Agreement ID:', creditAgreementId || 'None');
      console.log('  Amount:', payment.amount);
      console.log('  Payment Method:', payment.paymentMethod);
      console.log('  Date:', payment.date.toDate());
      
      // Get agreement details if available (for better description)
      let agreementInfo = '';
      if (customer && creditAgreementId) {
        const agreement = customer.creditAgreements?.find(a => a.id === creditAgreementId);
        if (agreement) {
          agreementInfo = ` for agreement #${creditAgreementId.substring(0, 6)}`;
        }
      }
      
      allTransactions.push({
        id: payment.id,
        type: "credit_payment",
        saleId: relatedSale?.id || "",
        creditAgreementId: payment.creditAgreementId,
        date: payment.date.toDate(),
        customerName: customer?.name || "Unknown Customer",
        totalAmount: payment.amount,
        paidAmount: payment.amount,
        outstandingAmount: 0, // This is a payment, not a debt
        description: `Credit Payment${agreementInfo}${payment.notes ? ` - ${payment.notes}` : ''}`,
        status: "paid",
        paymentMethod: payment.paymentMethod,
        payments: [{
          id: payment.id,
          amount: payment.amount,
          date: payment.date.toDate(),
          method: payment.paymentMethod,
          referenceCode: payment.referenceCode || payment.gcashReferenceNumber || payment.checkNumber
        }]
      });
    });

    // Sort transactions
    allTransactions.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? b.date.getTime() - a.date.getTime()
          : a.date.getTime() - b.date.getTime();
      } else if (sortBy === "amount") {
        return sortOrder === "desc"
          ? b.totalAmount - a.totalAmount
          : a.totalAmount - b.totalAmount;
      }
      return 0;
    });    
    
    // Log the transactions we've created
    console.log('CREATED TRANSACTIONS:');
    console.log('Total Transaction Records:', allTransactions.length);
    
    console.log('Sale Transactions:', allTransactions.filter(t => t.type === 'sale').length);
    console.log('Credit Payment Transactions:', allTransactions.filter(t => t.type === 'credit_payment').length);
    
    console.log('TRANSACTION DETAILS:');
    allTransactions.forEach((transaction, index) => {
      console.log(`Transaction ${index + 1} (ID: ${transaction.id}):`);
      console.log('  Type:', transaction.type);
      console.log('  Customer:', transaction.customerName);
      console.log('  Total Amount:', transaction.totalAmount);
      console.log('  Paid Amount:', transaction.paidAmount);
      console.log('  Status:', transaction.status);
      console.log('  Payment Method:', transaction.paymentMethod);
      console.log('  Date:', transaction.date);
      console.log('  Payments Count:', transaction.payments.length);
      
      // Log detailed COD information for each COD transaction
      if (transaction.isCOD) {
        console.log('  📦 COD TRANSACTION DETAILS:');
        console.log('    Delivery Address:', transaction.deliveryAddress || 'Not specified');
        console.log('    Delivery Date:', transaction.deliveryDate ? formatDate(transaction.deliveryDate) : 'Not scheduled');
      }
    });
    
    // Add a dedicated COD transactions summary
    const codTransactions = allTransactions.filter(t => t.isCOD);
    console.log('\nCOD TRANSACTIONS SUMMARY:');
    console.log('Total COD Transactions:', codTransactions.length);
    
    if (codTransactions.length > 0) {
      console.log('\nCOD Transactions List:');
      codTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. [${formatDate(transaction.date)}] ${transaction.customerName} - ${formatCurrency(transaction.totalAmount)}`);
        console.log(`   Payment Status: ${transaction.status}`);
        console.log(`   Address: ${transaction.deliveryAddress || 'Not specified'}`);
      });
    }
    
    console.log('--- END DEBUG TRANSACTION HISTORY ---');
    
    setTransactions(allTransactions);
  }, [sales, payments, customers, products, sortBy, sortOrder]);
  useEffect(() => {
    let filtered = transactions;

    // Log the filtering process
    console.log('FILTERING TRANSACTIONS:');
    console.log('Starting with', transactions.length, 'transactions');
    console.log('Selected filter:', selectedFilter);
    console.log('Selected type:', selectedType);

    // Filter by transaction type
    if (selectedType !== "all") {
      filtered = filtered.filter(t => t.type === selectedType);
      console.log('After type filter:', filtered.length, 'transactions');
    }

    // Filter by status
    if (selectedFilter !== "all") {
      if (selectedFilter === "cod") {
        // Filter for COD transactions only
        filtered = filtered.filter(t => t.isCOD === true);
        console.log('Showing COD transactions only:', filtered.length);
      } else if (selectedFilter === "pending") {
        filtered = filtered.filter(t => {
          // For credit payments, always include them
          if (t.type === "credit_payment") return true;
          // For sales, only include pending or partial
          return t.status === "pending" || t.status === "partial";
        });
      } else {
        filtered = filtered.filter(t => {
          // For credit payments, always include them
          if (t.type === "credit_payment") return true;
          // For sales, match the selected status
          return t.status === selectedFilter;
        });
      }
      console.log('After status filter:', filtered.length, 'transactions');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('After search filter:', filtered.length, 'transactions');
    }

    // Log the final filtered transactions
    console.log('Final filtered transactions:', filtered.length);
    console.log('Sale transactions:', filtered.filter(t => t.type === 'sale').length);
    console.log('Credit payment transactions:', filtered.filter(t => t.type === 'credit_payment').length);

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, selectedType, searchTerm]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (transaction: Transaction) => {
    // Special handling for credit payments
    if (transaction.type === "credit_payment") {
      return <span className="status-badge status-paid">Credit Payment</span>;
    }
    
    // Show COD status if it's a COD transaction
    if (transaction.isCOD) {
      // Create composite badge with COD and payment status
      const badgeClass = transaction.status === 'paid' ? 'status-paid' : 
                         transaction.status === 'partial' ? 'status-partial' : 'status-pending';
      
      return (
        <div className="status-badges">
          <span className="status-badge status-cod">COD</span>
          <span className={`status-badge ${badgeClass}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        </div>
      );
    }
    
    // Regular status badges for sales
    switch (transaction.status) {
      case "paid":
        return <span className="status-badge status-paid">Paid</span>;
      case "partial":
        return <span className="status-badge status-partial">Partial</span>;
      case "pending":
        return <span className="status-badge status-pending">Pending</span>;
      default:
        return <span className="status-badge status-paid">Paid</span>;
    }
  };

  const getMethodBadge = (method?: string) => {
    if (!method) return null;
    return (
      <span className={`method-badge method-${method.toLowerCase()}`}>
        {method}
      </span>
    );
  };
  
  // Function to show COD details modal
  const toggleCODDetails = (transaction: Transaction) => {
    if (!transaction.isCOD) return;
    
    // Set the selected transaction for the modal
    setSelectedCODTransaction(transaction);
  };
  
  // Calculate sales total (only from actual sales transactions)
  const totalSales = transactions
    .filter(t => t.type === "sale")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  // Calculate payments total (from sales payments and credit payments)
  // For sales, use the actual payment amount (not including change)
  // For credit payments, use the payment amount directly
  const totalPayments = transactions
    .filter(t => t.type === "sale")
    .reduce((sum, t) => sum + Math.min(t.paidAmount, t.totalAmount), 0) + 
    transactions
    .filter(t => t.type === "credit_payment")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="transaction-history">
      <div className="transaction-header">
        <h1 className="transaction-title">Transaction History</h1>
        <p className="transaction-subtitle">
          View all sales and payment transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon sales-icon">💰</div>
          <div className="summary-info">
            <h3>Total Sales</h3>
            <p className="summary-amount">{formatCurrency(totalSales)}</p>
            <span className="summary-count">
              {transactions.length} transactions
            </span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon payments-icon">💳</div>
          <div className="summary-info">
            <h3>Total Payments</h3>
            <p className="summary-amount">{formatCurrency(totalPayments)}</p>
            <span className="summary-count">
              {transactions.reduce((count, t) => count + t.payments.length, 0)}{" "}
              payments
            </span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon balance-icon">📊</div>
          <div className="summary-info">
            <h3>Outstanding</h3>
            <p className="summary-amount">
              {formatCurrency(totalSales - totalPayments)}
            </p>
            <span className="summary-count">Balance</span>
          </div>
        </div>
        <div className="summary-card cod-summary-card">
          <div className="summary-icon cod-icon">📦</div>
          <div className="summary-info">
            <h3>COD Orders</h3>
            <p className="summary-amount">
              {transactions.filter(t => t.isCOD).length}
            </p>
            <span className="summary-count">Cash on Delivery</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="transaction-controls">
        <div className="filter-section">
          {" "}
          <div className="filter-buttons">
            <button
              className={`filter-btn ${
                selectedFilter === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("all")}
            >
              All Transactions
            </button>
            <button
              className={`filter-btn ${
                selectedFilter === "paid" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("paid")}
            >
              Paid Sales
            </button>
            <button
              className={`filter-btn ${
                selectedFilter === "pending" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("pending")}
            >
              Pending/Credit Sales
            </button>
            <button
              className={`filter-btn ${selectedType === "credit_payment" ? "active" : ""}`}
              onClick={() => setSelectedType("credit_payment")}
            >
              Credit Payments
            </button>
            <button
              className={`filter-btn ${selectedType === "sale" ? "active" : ""}`}
              onClick={() => setSelectedType("sale")}
            >
              Sales Only
            </button>
            <button
              className={`filter-btn ${selectedType === "all" ? "active" : ""}`}
              onClick={() => setSelectedType("all")}
            >
              All Types
            </button>
            <button
              className={`filter-btn cod-filter-btn ${selectedFilter === "cod" ? "active" : ""}`}
              onClick={() => setSelectedFilter("cod")}
            >
              📦 COD Only
            </button>
          </div>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-section">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}
            className="sort-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="transaction-table-container">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Transactions Found</h3>
            <p>
              {searchTerm
                ? "Try adjusting your search criteria"
                : "No transactions available"}
            </p>
          </div>
        ) : (
          <table className="transaction-table">
            <thead>
              <tr>
                <th className="type-cell">Type</th>
                <th className="date-cell">Date & Time</th>
                <th className="customer-cell">Customer</th>
                <th className="description-cell">Description</th>
                <th className="amount-cell">Amount</th>
                <th className="status-cell">Status</th>
                <th className="method-cell">Method</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className={`transaction-row ${transaction.isCOD ? 'cod-transaction-row' : ''}`}
                  data-is-cod={transaction.isCOD ? 'true' : 'false'}
                >
                  <td className="type-cell">
                    <span className={`type-badge type-${transaction.type}`}>
                      {transaction.type === "sale" ? "🛒" : "💳"}{" "}
                      {transaction.type === "sale" ? "SALE" : "PAYMENT"}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(transaction.date)}</td>
                  <td className="customer-cell">
                    <div className="customer-wrapper">
                      <span className="customer-name">{transaction.customerName}</span>
                      {transaction.isCOD && (
                        <span 
                          className="cod-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCODDetails(transaction);
                          }}
                          title="Cash on Delivery"
                        >
                          📦 COD
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="description-cell">
                    {transaction.description}
                    {transaction.type === "sale" && transaction.discountTotal && 
                     transaction.discountTotal > 0 ? (
                      <div className="discount-info">
                        <span>Original: {formatCurrency(transaction.originalTotal || transaction.totalAmount)}</span>
                        <span>Discount: -{formatCurrency(transaction.discountTotal)}</span>
                      </div>
                    ) : null}
                    
                    {/* COD Details - Click to view in modal */}
                    {transaction.isCOD && (
                      <div className="cod-details-container">
                        <button 
                          className="cod-toggle-btn" 
                          onClick={() => toggleCODDetails(transaction)}
                        >
                          <i className="cod-arrow">📦</i>
                          View COD Details
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="amount-cell">
                    <span
                      className={`amount ${
                        transaction.type === "sale"
                          ? "sale-amount"
                          : "payment-amount"
                      }`}
                    >
                      {transaction.type === "sale" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.totalAmount))}
                    </span>
                  </td>
                  <td className="status-cell">{getStatusBadge(transaction)}</td>
                  <td className="method-cell">
                    {getMethodBadge(transaction.paymentMethod)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* COD Modal */}
      {selectedCODTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedCODTransaction(null)}>
          <div className="cod-modal" onClick={e => e.stopPropagation()}>
            <div className="cod-modal-header">
              <h3>Cash on Delivery Details</h3>
              <button className="cod-modal-close" onClick={() => setSelectedCODTransaction(null)}>×</button>
            </div>
            
            <div className="cod-modal-content">
              <div className="cod-modal-info-group">
                <h4>Customer Information</h4>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Customer:</span>
                  <span className="cod-modal-value">{selectedCODTransaction.customerName}</span>
                </div>
              </div>
              
              <div className="cod-modal-info-group">
                <h4>Delivery Information</h4>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Delivery Address:</span>
                  <span className="cod-modal-value">
                    {selectedCODTransaction.deliveryAddress || 'Not specified'}
                  </span>
                </div>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Delivery Date:</span>
                  <span className="cod-modal-value">
                    {selectedCODTransaction.deliveryDate ? formatDate(selectedCODTransaction.deliveryDate) : 'Not scheduled'}
                  </span>
                </div>
              </div>
              
              <div className="cod-modal-info-group">
                <h4>Payment Information</h4>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Total Amount:</span>
                  <span className="cod-modal-value">{formatCurrency(selectedCODTransaction.totalAmount)}</span>
                </div>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Paid Amount:</span>
                  <span className="cod-modal-value">{formatCurrency(selectedCODTransaction.paidAmount)}</span>
                </div>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Outstanding:</span>
                  <span className="cod-modal-value">{formatCurrency(selectedCODTransaction.outstandingAmount)}</span>
                </div>
                <div className="cod-modal-info-row">
                  <span className="cod-modal-label">Status:</span>
                  <span className="cod-modal-value">{getStatusBadge(selectedCODTransaction)}</span>
                </div>
              </div>
              
              {selectedCODTransaction.payments.length > 0 && (
                <div className="cod-modal-info-group">
                  <h4>Payment History</h4>
                  <table className="cod-payment-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCODTransaction.payments.map((payment, index) => (
                        <tr key={index}>
                          <td>{formatDate(payment.date)}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>{getMethodBadge(payment.method)}</td>
                          <td>{payment.referenceCode || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="cod-modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setSelectedCODTransaction(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
