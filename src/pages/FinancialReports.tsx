
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { StockMovement, Product, Sale } from "../types";
import "../styles/FinancialReports.css";
// For Font Awesome icons, add this link in your public/index.html: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />

const FinancialReports = () => {
  // ...existing code...
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesTotal, setSalesTotal] = useState(0); // Total sales/income
  const [expenses, setExpenses] = useState(0); // Total expenses
  const [grossProfit, setGrossProfit] = useState(0); // Sales minus direct costs
  const [netProfit, setNetProfit] = useState(0); // Final profit after all deductions

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch sales
      const salesSnap = await getDocs(collection(db, "sales"));
      const fetchedSalesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
      console.log("SALES DATA:", fetchedSalesData);
      
      // Fetch stock movements
      const stockSnap = await getDocs(collection(db, "stockMovements"));
      const stockData = stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockMovement[];
      console.log("STOCK MOVEMENTS:", stockData);
      
      // Fetch products
      const prodSnap = await getDocs(collection(db, "products"));
      const prodData = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      console.log("PRODUCTS:", prodData);
      
      setSalesData(fetchedSalesData);
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
    sales: number;
    costOfGoods: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
  }>>([]);

  useEffect(() => {
    // Calculate sales: sum of all sales total
    const totalSales = salesData.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
    console.log("Calculated Total Sales:", totalSales);

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
    console.log("====== EXPENSE CALCULATION DETAILS ======");
    let totalExpenses = 0;
    
    // Define a type for our expense log entries
    type ExpenseLogEntry = {
      movementId: string;
      date: string;
      product: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    };
    
    let expenseDetailsLog: ExpenseLogEntry[] = [];
    
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
      
      // Store expense details for summary log
      expenseDetailsLog.push({
        movementId: mov.id,
        date: mov.date ? mov.date.toString() : 'Unknown', // Convert timestamp to string
        product: product?.name || 'Unknown',
        quantity: quantity,
        unitCost: cost,
        totalCost: movementCost
      });
      
      totalExpenses += movementCost;
    });
    
    // Log expense summary table
    console.table(expenseDetailsLog);
    console.log(`Total Expenses: ${totalExpenses}`);
    console.log("========================================");
    
    // Create a map of product sales quantities (needed for expense calculations)
    const productSalesQuantityMap = new Map<string, number>();
    
    salesData.forEach(sale => {
      sale.items.forEach(item => {
        const productIdString = typeof item.productId === 'string'
          ? item.productId
          : item.productId.id || (item.productId.path ? item.productId.path.split('/').pop() : null);
        
        if (productIdString) {
          const existingQty = productSalesQuantityMap.get(productIdString) || 0;
          productSalesQuantityMap.set(productIdString, existingQty + item.qty);
        }
      });
    });
    
    console.log("Product Sales Quantity Map:", Object.fromEntries(productSalesQuantityMap));
    
    // First, calculate product-based cost of goods sold using product cost × quantity sold
    let productBasedCOGS = 0;
    products.forEach(product => {
      if (product.id) {
        const soldQuantity = productSalesQuantityMap.get(product.id) || 0;
        if (soldQuantity > 0) {
          const cost = product.cost || 0;
          productBasedCOGS += cost * soldQuantity;
        }
      }
    });
    
    // totalGrossProfit now represents product-based COGS calculation
    const totalGrossProfit = totalSales - productBasedCOGS;
    
    // totalNetProfit now represents stock movement-based expense calculation
    const totalNetProfit = totalSales - totalExpenses;
    
    // Detailed logging of financial calculations
    console.log("====== FINANCIAL CALCULATIONS ======");
    console.log("Calculated Sales/Income Total:", totalSales);
    console.log("Calculated Stock-Based Expenses:", totalExpenses);
    console.log("Calculated Product-Based COGS:", productBasedCOGS);
    console.log("Gross Profit Calculation (product-based):", `${totalSales} - ${productBasedCOGS} = ${totalGrossProfit}`);
    console.log("Calculated Gross Profit:", totalGrossProfit);
    console.log("Net Profit Calculation (stock-based):", `${totalSales} - ${totalExpenses} = ${totalNetProfit}`);
    console.log("Calculated Net Profit:", totalNetProfit);
    console.log("Gross Profit Margin:", totalSales > 0 ? `${((totalGrossProfit / totalSales) * 100).toFixed(2)}%` : "N/A (no sales)");
    console.log("Net Profit Margin:", totalSales > 0 ? `${((totalNetProfit / totalSales) * 100).toFixed(2)}%` : "N/A (no sales)");
    console.log("==================================");

    setSalesTotal(totalSales);
    setExpenses(totalExpenses);
    setGrossProfit(totalGrossProfit); // Set gross profit correctly
    setNetProfit(totalNetProfit); // Set net profit correctly

    // Create product breakdown report data
    const productSalesMap = new Map<string, { 
      quantitySold: number; 
      revenue: number; // Renamed from income to revenue
      name: string;
      sku: string;
    }>();
    
    // Process sales data to calculate revenue per product
    console.log("====== SALES CALCULATION DETAILS ======");
    
    // Define a type for our sales log entries
    type SalesLogEntry = {
      saleId: string;
      date: string;
      product: string;
      quantity: number;
      unitPrice: number;
      totalSale: number;
    };
    
    let salesDetailsLog: SalesLogEntry[] = [];
    
    salesData.forEach((sale: Sale) => {
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
              revenue: 0, 
              name: product.name,
              sku: product.sku || 'N/A'
            };
            
            const itemRevenue = item.price * item.qty;
            
            // Log each sale item
            console.log(`Sale ID: ${sale.id}, Product: ${product.name}, Qty: ${item.qty}, Price: ${item.price}, Revenue: ${itemRevenue}`);
            
            // Store sales details for summary log
            salesDetailsLog.push({
              saleId: sale.id,
              date: sale.date ? sale.date.toString() : 'Unknown',
              product: product.name,
              quantity: item.qty,
              unitPrice: item.price,
              totalSale: itemRevenue
            });
            
            productSalesMap.set(productIdString, {
              ...existingData,
              quantitySold: existingData.quantitySold + item.qty,
              revenue: existingData.revenue + itemRevenue
            });
          }
        }
      });
    });
    
    // Log sales summary table
    console.log("Sales Details:");
    console.table(salesDetailsLog);
    console.log("Sales Summary by Product:");
    console.table(Array.from(productSalesMap.entries()).map(([id, data]) => ({
      productId: id,
      name: data.name,
      sku: data.sku,
      quantitySold: data.quantitySold,
      totalRevenue: data.revenue
    })));
    console.log("========================================");
    
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
    
    // Combine sales and expense data for each product
    console.log("====== PRODUCT CALCULATIONS ======");
    const productBreakdownData = Array.from(productSalesMap.entries()).map(([id, data]) => {
      const costOfGoods = productExpenseMap.get(id) || 0;
      const grossProfit = data.revenue - costOfGoods;
      // For now, net profit equals gross profit until we implement additional deductions
      const netProfit = grossProfit;
      const grossMargin = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;
      
      // Log each product's financial calculations
      console.log(`Product: ${data.name} (ID: ${id})`);
      console.log(`  - Sales: ${data.revenue}`);
      console.log(`  - Quantity Sold: ${data.quantitySold}`);
      console.log(`  - Cost of Goods: ${costOfGoods}`);
      console.log(`  - Gross Profit Calculation: ${data.revenue} - ${costOfGoods} = ${grossProfit}`);
      console.log(`  - Gross Profit Margin: ${grossMargin.toFixed(2)}%`);
      console.log("-------------------------------");
      
      return {
        id,
        name: data.name,
        sku: data.sku,
        quantitySold: data.quantitySold,
        sales: data.revenue,
        costOfGoods,
        grossProfit,
        netProfit,
        grossMargin
      };
    });
    console.log("==================================");
    
    // Sort by gross profit (highest first)
    productBreakdownData.sort((a, b) => b.grossProfit - a.grossProfit);
    
    // Calculate and log product summary data
    const totalProductSales = productBreakdownData.reduce((sum, product) => sum + product.sales, 0);
    const totalProductCOGS = productBreakdownData.reduce((sum, product) => sum + product.costOfGoods, 0);
    const totalProductGrossProfit = productBreakdownData.reduce((sum, product) => sum + product.grossProfit, 0);
    const totalProductNetProfit = productBreakdownData.reduce((sum, product) => sum + product.netProfit, 0);
    
    console.log("====== PRODUCT SUMMARY TOTALS ======");
    console.log(`Total Product Sales: ${totalProductSales}`);
    console.log(`Total Product COGS: ${totalProductCOGS}`);
    console.log(`Total Product Gross Profit: ${totalProductGrossProfit}`);
    console.log(`Total Product Net Profit: ${totalProductNetProfit}`);
    console.log(`Overall Gross Margin: ${totalProductSales > 0 ? ((totalProductGrossProfit / totalProductSales) * 100).toFixed(2) : 0}%`);
    console.log("====================================");
    
    setProductBreakdown(productBreakdownData);
  }, [salesData, stockMovements, products]);

  const handleExportCSV = () => {
    // Create Financial Statement CSV with Summary and Product Breakdown
    
    // Start with Financial Summary Section
    const summaryHeaders = ["Financial Summary", "", "", "", "", "", ""];
    const summaryRows = [
      ["Total Sales/Income", "", "", `₱${salesTotal.toFixed(2)}`, "", "", ""],
      ["Total Expenses", "", "", `₱${expenses.toFixed(2)}`, "", "", ""],
      ["Gross Profit", "", "", `₱${grossProfit.toFixed(2)}`, "", "", `${salesTotal > 0 ? ((grossProfit / salesTotal) * 100).toFixed(2) : 0}%`],
      ["Net Profit", "", "", `₱${netProfit.toFixed(2)}`, "", "", `${salesTotal > 0 ? ((netProfit / salesTotal) * 100).toFixed(2) : 0}%`],
      ["", "", "", "", "", "", ""], // Empty row as separator
    ];
    
    // Then Product Breakdown Section
    const productHeaders = ["Product Name", "SKU", "Quantity Sold", "Sales/Income", "Cost of Goods", "Gross Profit", "Gross Margin (%)"];
    
    const productRows = [
      ...productBreakdown.map(product => [
        `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in product names
        product.sku,
        product.quantitySold,
        product.sales.toFixed(2),
        product.costOfGoods.toFixed(2),
        product.grossProfit.toFixed(2),
        product.grossMargin.toFixed(2)
      ]),
      // Add a totals row
      [
        '"TOTAL"',
        '',
        productBreakdown.reduce((sum, product) => sum + product.quantitySold, 0),
        productBreakdown.reduce((sum, product) => sum + product.sales, 0).toFixed(2),
        productBreakdown.reduce((sum, product) => sum + product.costOfGoods, 0).toFixed(2),
        productBreakdown.reduce((sum, product) => sum + product.grossProfit, 0).toFixed(2),
        (productBreakdown.reduce((sum, product) => sum + product.sales, 0) > 0 ? 
          (productBreakdown.reduce((sum, product) => sum + product.grossProfit, 0) / 
           productBreakdown.reduce((sum, product) => sum + product.sales, 0) * 100) : 0).toFixed(2)
      ]
    ];
    
    // Combine all rows for the final CSV
    const csvRows = [
      summaryHeaders.join(","),
      ...summaryRows.map(row => row.join(",")),
      productHeaders.join(","),
      ...productRows.map(row => row.join(","))
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
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="card-content">
              <h3>Income/Sales</h3>
              <div className="card-value">₱{salesTotal.toLocaleString()}</div>
              {salesTotal > 0 && salesData.length > 0 && (
                <div className="card-subtitle">
                  {salesData.length} transactions
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
              {salesTotal > 0 && (
                <div className="card-subtitle">
                  {((expenses / salesTotal) * 100).toFixed(0)}% of sales
                </div>
              )}
            </div>
          </div>
          
          <div className="summary-card gross-profit">
            <div className="card-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="card-content">
              <h3>Gross Profit</h3>
              <div className="card-value">₱{grossProfit.toLocaleString()}</div>
              {salesTotal > 0 && (
                <div className="card-subtitle">
                  {((grossProfit / salesTotal) * 100).toFixed(0)}% margin
                </div>
              )}
            </div>
          </div>
          
          <div className="summary-card net-profit">
            <div className="card-icon">
              <i className="fas fa-coins"></i>
            </div>
            <div className="card-content">
              <h3>Net Profit</h3>
              <div className="card-value">₱{netProfit.toLocaleString()}</div>
              {salesTotal > 0 && (
                <div className="card-subtitle">
                  {((netProfit / salesTotal) * 100).toFixed(0)}% of sales
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
            <div className="section-subtitle">Breakdown of revenue by payment type</div>
          </div>
          
          <div className="payment-distribution">
            {(() => {
              const paymentMethods = salesData.reduce((acc: Record<string, number>, sale: Sale) => {
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
                const percentage = salesTotal > 0 ? ((amount / salesTotal) * 100) : 0;
                
                return (
                  <div className={`payment-method-card ${method}`} key={idx}>
                    <div className="method-icon">
                      <i className={`fas ${methodIcons[method] || 'fa-circle'}`}></i>
                    </div>
                    <div className="method-details">
                      <h3>{method.charAt(0).toUpperCase() + method.slice(1)}</h3>
                      <div className="payment-amount">₱{amount.toLocaleString()}</div>
                      <div className="payment-percentage">
                        {percentage.toFixed(1)}% of total revenue
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
              <div className="insight-value">{salesData.length}</div>
              <div className="insight-description">Number of transactions</div>
            </div>
            
            <div className="insight-card">
              <div className="insight-header">
                <span className="insight-icon"><i className="fas fa-calculator"></i></span>
                <h3>Average Value</h3>
              </div>
              <div className="insight-value">₱{salesData.length > 0 ? (salesTotal / salesData.length).toFixed(0) : '0'}</div>
              <div className="insight-description">Per transaction</div>
            </div>
            
            <div className="insight-card">
              <div className="insight-header">
                <span className="insight-icon"><i className="fas fa-percentage"></i></span>
                <h3>Gross Margin</h3>
              </div>
              <div className="insight-value">{salesTotal > 0 ? ((grossProfit / salesTotal) * 100).toFixed(1) : '0'}%</div>
              <div className="insight-description">Sales to gross profit ratio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Breakdown - Accounting Style */}
      <div className="report-section product-breakdown-section">
        <div className="section-header">
          <h2 className="section-title">Product Analysis</h2>
          <div className="section-subtitle">Detailed breakdown of sales, expenses, and profits by product</div>
        </div>

        <div className="accounting-table-container">
          <table className="accounting-table">
            <thead>
              <tr>
                <th className="product-name-col">Product</th>
                <th>SKU</th>
                <th>Qty Sold</th>
                <th>Sales/Income</th>
                <th>Cost of Goods</th>
                <th>Gross Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {productBreakdown.map(product => (
                <tr key={product.id} className={product.grossProfit < 0 ? 'negative-profit' : ''}>
                  <td className="product-name-col">{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.quantitySold}</td>
                  <td>₱{product.sales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td>₱{product.costOfGoods.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className={product.grossProfit < 0 ? 'negative-value' : 'positive-value'}>
                    ₱{product.grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className={product.grossMargin < 0 ? 'negative-value' : 'positive-value'}>
                    {product.grossMargin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-totals">
                <td colSpan={2}><strong>TOTAL</strong></td>
                <td><strong>{productBreakdown.reduce((sum, product) => sum + product.quantitySold, 0)}</strong></td>
                <td><strong>₱{productBreakdown.reduce((sum, product) => sum + product.sales, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td><strong>₱{productBreakdown.reduce((sum, product) => sum + product.costOfGoods, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td><strong>₱{productBreakdown.reduce((sum, product) => sum + product.grossProfit, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>
                  <strong>
                    {(productBreakdown.reduce((sum, product) => sum + product.sales, 0) > 0 ? 
                      (productBreakdown.reduce((sum, product) => sum + product.grossProfit, 0) / 
                      productBreakdown.reduce((sum, product) => sum + product.sales, 0) * 100) : 0).toFixed(1)}%
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
