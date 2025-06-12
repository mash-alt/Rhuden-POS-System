import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useSuppliers } from '../hooks/useSuppliers';
import useSales from '../hooks/useSales';
import { usePayments } from '../hooks/usePayments';
import useCustomers from '../hooks/useCustomers';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { products } = useProducts();
  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { sales } = useSales();
  const { payments } = usePayments();
  const { customers } = useCustomers();

  const [dateRange, setDateRange] = useState('today');
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    // Calculate low stock products
    const lowStock = products.filter(product => 
      product.active && 
      (product.stockQuantity || 0) <= (product.reorderLevel || 0) &&
      (product.reorderLevel || 0) > 0
    );
    setLowStockProducts(lowStock);
  }, [products]);

  // Calculate dashboard metrics
  const getDateFilteredData = (data: any[], dateField: string = 'date') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter(item => {
      const itemDate = item[dateField]?.toDate() || new Date(item[dateField]);
      switch (dateRange) {
        case 'today':
          return itemDate >= today;
        case 'yesterday':
          return itemDate >= yesterday && itemDate < today;
        case 'week':
          return itemDate >= weekAgo;
        case 'month':
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredSales = getDateFilteredData(sales);
  const filteredPayments = getDateFilteredData(payments);

  // Calculate metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);  const totalOutstanding = sales.reduce((sum, sale) => {
    const salePayments = payments.filter((p: any) => {
      const saleId = typeof p.saleId === 'string' ? p.saleId : p.saleId?.id;
      return saleId === sale.id;
    });
    const paidAmount = salePayments.reduce((pSum: number, p: any) => pSum + p.amount, 0);
    return sum + Math.max(0, sale.total - paidAmount);
  }, 0);

  const creditCustomers = customers.filter(customer => (customer.creditBalance || 0) > 0);
  const inventoryValue = products.reduce((sum, product) => sum + ((product.cost || 0) * (product.stockQuantity || 0)), 0);
  const retailValue = products.reduce((sum, product) => sum + (product.price * (product.stockQuantity || 0)), 0);
  // Recent activities
  const recentSales = sales
    .sort((a: any, b: any) => b.date.toDate().getTime() - a.date.toDate().getTime())
    .slice(0, 5);

  const recentPayments = payments
    .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => `₱${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => timestamp.toDate().toLocaleDateString();

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your business today.</p>
        </div>
        
        {/* Date Filter */}
        <div className="date-filter">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-select"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(totalSales)}</div>
            <div className="metric-label">Sales Revenue</div>
            <div className="metric-count">{filteredSales.length} transactions</div>
          </div>
        </div>

        <div className="metric-card payments">
          <div className="metric-icon">💳</div>
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(totalPayments)}</div>
            <div className="metric-label">Payments Received</div>
            <div className="metric-count">{filteredPayments.length} payments</div>
          </div>
        </div>

        <div className="metric-card outstanding">
          <div className="metric-icon">⏰</div>
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(totalOutstanding)}</div>
            <div className="metric-label">Outstanding Amount</div>
            <div className="metric-count">{creditCustomers.length} customers</div>
          </div>
        </div>

        <div className="metric-card inventory">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(inventoryValue)}</div>
            <div className="metric-label">Inventory Value</div>
            <div className="metric-count">{products.length} products</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/pos" className="action-card pos-action">
            <div className="action-icon">🛒</div>
            <div className="action-content">
              <h3>New Sale</h3>
              <p>Process a new transaction</p>
            </div>
          </Link>

          <Link to="/inventory" className="action-card inventory-action">
            <div className="action-icon">📦</div>
            <div className="action-content">
              <h3>Manage Inventory</h3>
              <p>Add or update products</p>
            </div>
          </Link>

          <Link to="/transactions" className="action-card history-action">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h3>View Transactions</h3>
              <p>Browse sales and payments</p>
            </div>
          </Link>

          <Link to="/customers" className="action-card customer-action">
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h3>Manage Customers</h3>
              <p>View customer accounts</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-content">
        {/* Alerts & Notifications */}
        <div className="dashboard-section alerts-section">
          <h2>⚠️ Alerts & Notifications</h2>
          <div className="alerts-content">
            {lowStockProducts.length > 0 && (
              <div className="alert-item low-stock">
                <div className="alert-icon">📉</div>
                <div className="alert-content">
                  <h4>Low Stock Alert</h4>
                  <p>{lowStockProducts.length} products are running low</p>
                  <div className="low-stock-products">
                    {lowStockProducts.slice(0, 3).map(product => (
                      <span key={product.id} className="low-stock-badge">
                        {product.name} ({product.stockQuantity || 0} left)
                      </span>
                    ))}
                    {lowStockProducts.length > 3 && (
                      <span className="more-items">+{lowStockProducts.length - 3} more</span>
                    )}
                  </div>
                </div>
                <Link to="/inventory" className="alert-action">View All</Link>
              </div>
            )}

            {creditCustomers.length > 0 && (
              <div className="alert-item credit-alert">
                <div className="alert-icon">💳</div>
                <div className="alert-content">
                  <h4>Outstanding Credit</h4>
                  <p>{creditCustomers.length} customers have outstanding balances</p>
                  <div className="credit-customers">
                    {creditCustomers.slice(0, 2).map(customer => (
                      <span key={customer.id} className="credit-badge">
                        {customer.name} ({formatCurrency(customer.creditBalance || 0)})
                      </span>
                    ))}
                    {creditCustomers.length > 2 && (
                      <span className="more-items">+{creditCustomers.length - 2} more</span>
                    )}
                  </div>
                </div>
                <Link to="/customers" className="alert-action">Manage</Link>
              </div>
            )}

            {lowStockProducts.length === 0 && creditCustomers.length === 0 && (
              <div className="no-alerts">
                <div className="no-alerts-icon">✅</div>
                <p>All good! No alerts at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="dashboard-section recent-sales">
          <h2>📈 Recent Sales</h2>
          <div className="recent-list">
            {recentSales.length === 0 ? (
              <div className="no-data">No recent sales</div>
            ) : (
              recentSales.map(sale => (
                <div key={sale.id} className="recent-item">
                  <div className="recent-info">
                    <div className="recent-id">Sale #{sale.id.slice(-6)}</div>
                    <div className="recent-date">{formatDate(sale.date)}</div>
                  </div>
                  <div className="recent-amount">{formatCurrency(sale.total)}</div>
                  <div className={`recent-status status-${sale.creditStatus || 'paid'}`}>
                    {sale.creditStatus || 'Paid'}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/transactions" className="view-all-link">View All Transactions →</Link>
        </div>

        {/* Recent Payments */}
        <div className="dashboard-section recent-payments">
          <h2>💰 Recent Payments</h2>
          <div className="recent-list">
            {recentPayments.length === 0 ? (
              <div className="no-data">No recent payments</div>            ) : (
              recentPayments.map((payment: any) => (
                <div key={payment.id} className="recent-item">
                  <div className="recent-info">
                    <div className="recent-id">Payment #{payment.id.slice(-6)}</div>
                    <div className="recent-date">{formatDate(payment.date)}</div>
                  </div>
                  <div className="recent-amount">{formatCurrency(payment.amount)}</div>
                  <div className={`payment-method method-${payment.paymentMethod}`}>
                    {payment.paymentMethod.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/transactions" className="view-all-link">View All Payments →</Link>
        </div>

        {/* Business Summary */}
        <div className="dashboard-section business-summary">
          <h2>📊 Business Summary</h2>
          <div className="summary-stats">
            <div className="summary-stat">
              <div className="summary-label">Total Products</div>
              <div className="summary-value">{products.length}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-label">Categories</div>
              <div className="summary-value">{categories.length}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-label">Suppliers</div>
              <div className="summary-value">{suppliers.length}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-label">Customers</div>
              <div className="summary-value">{customers.length}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-label">Retail Value</div>
              <div className="summary-value">{formatCurrency(retailValue)}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-label">Profit Margin</div>
              <div className="summary-value">
                {inventoryValue > 0 ? `${(((retailValue - inventoryValue) / retailValue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;