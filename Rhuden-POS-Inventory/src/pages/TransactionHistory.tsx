import { useState, useEffect } from "react";
import { useSales } from "../hooks/useSales";
import { usePayments } from "../hooks/usePayments";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import "../styles/TransactionHistory.css";

interface Transaction {
  id: string;
  type: "sale";
  saleId: string;
  date: Date;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  description: string;
  status: "paid" | "partial" | "pending";
  paymentMethod: string;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const saleTransactions: Transaction[] = [];

    // Create transactions from sales with their associated payments
    sales.forEach((sale) => {
      const customerId = sale.customerId?.id;
      const customer = customers.find((c) => c.id === customerId);

      // Find all payments for this sale
      const salePayments = payments.filter(
        (payment) => payment.saleId?.id === sale.id
      );      // Calculate total paid amount
      const totalPaid = salePayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      
      // For non-credit sales, use the sale's amountPaid field
      // For credit sales, use the sum of payments
      const actualPaidAmount = sale.paymentMethod === 'credit' ? totalPaid : (sale.amountPaid || 0);
      const outstanding = sale.total - actualPaidAmount;

      // Determine status based on payment amounts
      let status: "paid" | "partial" | "pending";
      if (actualPaidAmount >= sale.total) {
        status = "paid";
      } else if (actualPaidAmount > 0) {
        status = "partial";
      } else {
        status = "pending";
      }// Get item names for description
      const itemNames = sale.items
        .map(item => {
          const product = products.find(p => p.id === item.productId.id);
          return product ? `${product.name} (${item.qty})` : `Unknown Item (${item.qty})`;
        })
        .join(', ');

      saleTransactions.push({
        id: sale.id,
        type: "sale",
        saleId: sale.id,
        date: sale.date.toDate(),        customerName: customer?.name || "Walk-in Customer",
        totalAmount: sale.total,
        paidAmount: actualPaidAmount,
        outstandingAmount: outstanding,
        description: `${itemNames}`,
        status: status,
        paymentMethod: sale.paymentMethod,
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

    // Sort transactions
    saleTransactions.sort((a, b) => {
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
    });    setTransactions(saleTransactions);
  }, [sales, payments, customers, products, sortBy, sortOrder]);
  useEffect(() => {
    let filtered = transactions;

    // Filter by status
    if (selectedFilter !== "all") {
      if (selectedFilter === "pending") {
        filtered = filtered.filter(
          (t) => t.status === "pending" || t.status === "partial"
        );
      } else {
        filtered = filtered.filter((t) => t.status === selectedFilter);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, searchTerm]);

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
  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  const totalPayments = transactions.reduce((sum, t) => sum + t.paidAmount, 0);

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
              All Sales
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
                <th>Type</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="transaction-row">
                  <td>
                    <span className={`type-badge type-${transaction.type}`}>
                      {transaction.type === "sale" ? "🛒" : "💳"}{" "}
                      {transaction.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(transaction.date)}</td>
                  <td className="customer-cell">{transaction.customerName}</td>
                  <td className="description-cell">
                    {transaction.description}
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
    </div>
  );
};

export default TransactionHistory;
