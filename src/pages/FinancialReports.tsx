
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { StockMovement, Product, Sale } from "../types";
import "../styles/FinancialReports.css";
// For Font Awesome icons, add this link in your public/index.html: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />

const FinancialReports = () => {
  // ...existing code...
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch sales
      const salesSnap = await getDocs(collection(db, "sales"));
      const salesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
      console.log("SALES DATA:", salesData);
      
      // Fetch stock movements
      const stockSnap = await getDocs(collection(db, "stockMovements"));
      const stockData = stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockMovement[];
      console.log("STOCK MOVEMENTS:", stockData);
      
      // Fetch products
      const prodSnap = await getDocs(collection(db, "products"));
      const prodData = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      console.log("PRODUCTS:", prodData);
      
      setSales(salesData);
      setStockMovements(stockData);
      setProducts(prodData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // New state to hold product breakdown data
  const [productBreakdown, setProductBreakdown] = useState<Array<{
    id: string;
    name: string;
    sku: string;
    quantitySold: number;
    income: number;
    costOfGoods: number;
    profit: number;
    profitMargin: number;
  }>>([]);

  useEffect(() => {
    // Calculate income: sum of all sales total
    const totalIncome = sales.reduce((sum, sale) => sum + sale.total, 0);
    console.log("Calculated Income:", totalIncome);

    // Log all stock movements first to analyze
    console.log("All Stock Movements:", stockMovements);
    
    // Get all 'in' movements to see what we have
    const inMovements = stockMovements.filter(mov => mov.type === 'in');
    console.log("All IN Stock Movements:", inMovements);
    
    // Get all unique reasons for 'in' movements
    const uniqueReasons = [...new Set(inMovements.map(mov => mov.reason))];
    console.log("Unique reasons for IN movements:", uniqueReasons);
    
    // Log filtered stock movements for expenses (using original filter)
    const purchaseMovements = stockMovements.filter(mov => mov.type === 'in' && mov.reason === 'purchase');
    console.log("Purchase Movements (for expenses):", purchaseMovements);
    
    // If no purchase movements found, try with any 'in' movement
    const movementsForExpenses = purchaseMovements.length > 0 ? purchaseMovements : inMovements;
    console.log("Movements being used for expense calculation:", movementsForExpenses);
    
    // We're using these movements for expense calculations
    
    // Calculate expenses with detailed logging
    let totalExpenses = 0;
    movementsForExpenses.forEach(mov => {
      console.log("Stock movement productId:", mov.productId);
      
      // Try different ways to get the product ID from the DocumentReference
      const productIdString = typeof mov.productId === 'string' 
        ? mov.productId 
        : mov.productId.id || (mov.productId.path ? mov.productId.path.split('/').pop() : null);
      
      console.log("Extracted product ID:", productIdString);
      
      const product = products.find(p => p.id === productIdString);
      console.log("Product for expense calculation:", product);
      
      const cost = product?.cost || 0;
      const quantity = mov.quantity;
      const movementCost = cost * quantity;
      
      console.log(`Movement ID: ${mov.id}, Product: ${product?.name}, Cost: ${cost}, Quantity: ${quantity}, Total Cost: ${movementCost}`);
      
      totalExpenses += movementCost;
    });
    
    console.log("Calculated Expenses:", totalExpenses);
    console.log("Calculated Profit:", totalIncome - totalExpenses);

    setIncome(totalIncome);
    setExpenses(totalExpenses);
    setProfit(totalIncome - totalExpenses);

    // Create product breakdown report data
    const productSalesMap = new Map<string, { 
      quantitySold: number; 
      income: number; 
      name: string;
      sku: string;
    }>();
    
    // Process sales data to calculate revenue per product
    sales.forEach(sale => {
      sale.items.forEach(item => {
        // Get the product ID from the DocumentReference
        const productIdString = typeof item.productId === 'string'
          ? item.productId
          : item.productId.id || (item.productId.path ? item.productId.path.split('/').pop() : null);
        
        if (productIdString) {
          const product = products.find(p => p.id === productIdString);
          if (product) {
            const existingData = productSalesMap.get(productIdString) || { 
              quantitySold: 0, 
              income: 0, 
              name: product.name,
              sku: product.sku || 'N/A'
            };
            
            productSalesMap.set(productIdString, {
              ...existingData,
              quantitySold: existingData.quantitySold + item.qty,
              income: existingData.income + (item.price * item.qty)
            });
          }
        }
      });
    });
    
    // Process expense data by product
    const productExpenseMap = new Map<string, number>();
    
    movementsForExpenses.forEach(mov => {
      const productIdString = typeof mov.productId === 'string'
        ? mov.productId
        : mov.productId.id || (mov.productId.path ? mov.productId.path.split('/').pop() : null);
      
      if (productIdString) {
        const product = products.find(p => p.id === productIdString);
        if (product) {
          const cost = product.cost || 0;
          const existingCost = productExpenseMap.get(productIdString) || 0;
          productExpenseMap.set(productIdString, existingCost + (cost * mov.quantity));
        }
      }
    });
    
    // Combine income and expense data for each product
    const productBreakdownData = Array.from(productSalesMap.entries()).map(([id, data]) => {
      const costOfGoods = productExpenseMap.get(id) || 0;
      const profit = data.income - costOfGoods;
      const profitMargin = data.income > 0 ? (profit / data.income) * 100 : 0;
      
      return {
        id,
        name: data.name,
        sku: data.sku,
        quantitySold: data.quantitySold,
        income: data.income,
        costOfGoods,
        profit,
        profitMargin
      };
    });
    
    // Sort by profit (highest first)
    productBreakdownData.sort((a, b) => b.profit - a.profit);
    
    setProductBreakdown(productBreakdownData);
  }, [sales, stockMovements, products]);

  const handleExportCSV = () => {
    // Create Accounting-Style Product Breakdown CSV
    const headers = ["Product Name", "SKU", "Quantity Sold", "Income", "Cost of Goods", "Profit", "Profit Margin (%)"];
    
    const csvRows = [
      headers.join(","),
      ...productBreakdown.map(product => [
        `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in product names
        product.sku,
        product.quantitySold,
        product.income.toFixed(2),
        product.costOfGoods.toFixed(2),
        product.profit.toFixed(2),
        product.profitMargin.toFixed(2)
      ].join(",")),
      // Add a totals row
      [
        '"TOTAL"',
        '',
        productBreakdown.reduce((sum, product) => sum + product.quantitySold, 0),
        productBreakdown.reduce((sum, product) => sum + product.income, 0).toFixed(2),
        productBreakdown.reduce((sum, product) => sum + product.costOfGoods, 0).toFixed(2),
        productBreakdown.reduce((sum, product) => sum + product.profit, 0).toFixed(2),
        (productBreakdown.reduce((sum, product) => sum + product.income, 0) > 0 ? 
          (productBreakdown.reduce((sum, product) => sum + product.profit, 0) / 
           productBreakdown.reduce((sum, product) => sum + product.income, 0) * 100) : 0).toFixed(2)
      ].join(",")
    ];
    
    const csvContent = csvRows.join("\n");
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `accounting_report_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="financial-reports-container">Loading financial reports...</div>;

  return (
    <div className="financial-reports-container">
      <h1>Financial Reports</h1>
      <div className="report-actions">
        <button onClick={handleExportCSV}>Export to CSV</button>
        <button onClick={handlePrint}>Print Report</button>
      </div>
      <div className="financial-summary-container">
        <h2 className="section-title">Financial Overview</h2>
        <div className="financial-summary">
          <div className="summary-card income">
            <div className="card-icon">
              <i className="fas fa-arrow-up"></i>
            </div>
            <div className="card-content">
              <h3>Income</h3>
              <div className="card-value">₱{income.toLocaleString()}</div>
              {income > 0 && sales.length > 0 && (
                <div className="card-subtitle">
                  {sales.length} transactions
                </div>
              )}
            </div>
          </div>
          
          <div className="summary-card expenses">
            <div className="card-icon">
              <i className="fas fa-arrow-down"></i>
            </div>
            <div className="card-content">
              <h3>Expenses</h3>
              <div className="card-value">₱{expenses.toLocaleString()}</div>
              {income > 0 && (
                <div className="card-subtitle">
                  {((expenses / income) * 100).toFixed(0)}% of income
                </div>
              )}
            </div>
          </div>
          
          <div className="summary-card profit">
            <div className="card-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="card-content">
              <h3>Profit</h3>
              <div className="card-value">₱{profit.toLocaleString()}</div>
              {income > 0 && (
                <div className="card-subtitle">
                  {((profit / income) * 100).toFixed(0)}% margin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced Financial Report Elements */}
      <div className="report-sections">
        
        {/* Payment Method Distribution */}
        <div className="report-section payment-method-section">
          <div className="section-header">
            <h2 className="section-title">Payment Method Distribution</h2>
            <div className="section-subtitle">Breakdown of income by payment type</div>
          </div>
          
          <div className="payment-distribution">
            {(() => {
              const paymentMethods = sales.reduce((acc, sale) => {
                acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
                return acc;
              }, {} as Record<string, number>);
              
              // Map payment methods to their icons
              const methodIcons: Record<string, string> = {
                'cash': 'fa-money-bill-wave',
                'gcash': 'fa-mobile-alt',
                'credit': 'fa-credit-card',
              };
              
              return Object.entries(paymentMethods).map(([method, amount], idx) => {
                const percentage = income > 0 ? ((amount / income) * 100) : 0;
                
                return (
                  <div className={`payment-method-card ${method}`} key={idx}>
                    <div className="method-icon">
                      <i className={`fas ${methodIcons[method] || 'fa-circle'}`}></i>
                    </div>
                    <div className="method-details">
                      <h3>{method.charAt(0).toUpperCase() + method.slice(1)}</h3>
                      <div className="payment-amount">₱{amount.toLocaleString()}</div>
                      <div className="payment-percentage">
                        {percentage.toFixed(1)}% of total income
                      </div>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
        
        {/* Sales Analysis Section */}
        <div className="report-section">
          <div className="section-header">
            <h2 className="section-title">Sales Insights</h2>
            <div className="section-subtitle">Key metrics from your sales data</div>
          </div>
          
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-header">
                <span className="insight-icon"><i className="fas fa-shopping-cart"></i></span>
                <h3>Total Sales</h3>
              </div>
              <div className="insight-value">{sales.length}</div>
              <div className="insight-description">Number of transactions</div>
            </div>
            
            <div className="insight-card">
              <div className="insight-header">
                <span className="insight-icon"><i className="fas fa-calculator"></i></span>
                <h3>Average Value</h3>
              </div>
              <div className="insight-value">₱{sales.length > 0 ? (income / sales.length).toFixed(0) : '0'}</div>
              <div className="insight-description">Per transaction</div>
            </div>
            
            <div className="insight-card">
              <div className="insight-header">
                <span className="insight-icon"><i className="fas fa-percentage"></i></span>
                <h3>Profit Margin</h3>
              </div>
              <div className="insight-value">{income > 0 ? ((profit / income) * 100).toFixed(1) : '0'}%</div>
              <div className="insight-description">Overall profitability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Breakdown - Accounting Style */}
      <div className="report-section product-breakdown-section">
        <div className="section-header">
          <h2 className="section-title">Product Profit Analysis</h2>
          <div className="section-subtitle">Detailed breakdown of revenue and profit by product</div>
        </div>

        <div className="accounting-table-container">
          <table className="accounting-table">
            <thead>
              <tr>
                <th className="product-name-col">Product</th>
                <th>SKU</th>
                <th>Qty Sold</th>
                <th>Income</th>
                <th>Cost of Goods</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {productBreakdown.map(product => (
                <tr key={product.id} className={product.profit < 0 ? 'negative-profit' : ''}>
                  <td className="product-name-col">{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.quantitySold}</td>
                  <td>₱{product.income.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td>₱{product.costOfGoods.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className={product.profit < 0 ? 'negative-value' : 'positive-value'}>
                    ₱{product.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className={product.profitMargin < 0 ? 'negative-value' : 'positive-value'}>
                    {product.profitMargin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-totals">
                <td colSpan={2}><strong>TOTAL</strong></td>
                <td><strong>{productBreakdown.reduce((sum, product) => sum + product.quantitySold, 0)}</strong></td>
                <td><strong>₱{productBreakdown.reduce((sum, product) => sum + product.income, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td><strong>₱{productBreakdown.reduce((sum, product) => sum + product.costOfGoods, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td><strong>₱{productBreakdown.reduce((sum, product) => sum + product.profit, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>
                  <strong>
                    {(productBreakdown.reduce((sum, product) => sum + product.income, 0) > 0 ? 
                      (productBreakdown.reduce((sum, product) => sum + product.profit, 0) / 
                      productBreakdown.reduce((sum, product) => sum + product.income, 0) * 100) : 0).toFixed(1)}%
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
