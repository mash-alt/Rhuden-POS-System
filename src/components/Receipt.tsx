import React from 'react';
import type { Sale, Product, Customer } from '../types';
import '../styles/Receipt.css';
import '../styles/receipt-discount.css';

interface ReceiptProps {
  sale: Sale;
  products: Product[];
  customer: Customer | null;
  change?: number;
}

const Receipt: React.FC<ReceiptProps> = ({ sale, products, customer, change = 0 }) => {
  // Find product details for each item in the sale
  const saleItems = sale.items.map(item => {
    // Handle different formats of productId
    const productId = typeof item.productId === 'string' 
      ? item.productId 
      : (item.productId.id || item.productId.path?.split('/').pop());
      
    const product = products.find(p => p.id === productId);
    
    return {
      productName: product?.name || 'Unknown Product',
      sku: product?.sku || '',
      price: item.price,
      quantity: item.qty,
      subtotal: item.price * item.qty,
      originalPrice: item.originalPrice || item.price,
      discountAmount: item.discountAmount || 0,
      discountPercent: item.discountPercent || 0
    };
  });

  // Format date
  const formatDate = (date: any) => {
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  // Format receipt number from sale ID
  const formatReceiptNumber = (id: string) => {
    return `R-${id.substring(0, 8).toUpperCase()}`;
  };

  return (
    <div className="receipt" id="receipt-to-print">
      <div className="receipt-header">
        <h1>Rhuden Building Supply</h1>
        <p>123 Construction Road, Manila</p>
        <p>Tel: (02) 1234-5678</p>
        <div className="receipt-divider"></div>
      </div>
      
      <div className="receipt-info">
        <div className="receipt-row">
          <span>Receipt #:</span>
          <span>{formatReceiptNumber(sale.id)}</span>
        </div>
        <div className="receipt-row">
          <span>Date:</span>
          <span>{formatDate(sale.date)}</span>
        </div>
        {customer && (
          <div className="receipt-row">
            <span>Customer:</span>
            <span>{customer.name}</span>
          </div>
        )}
        <div className="receipt-row">
          <span>Payment:</span>
          <span>{sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}</span>
        </div>
        {sale.paymentMethod === 'gcash' && sale.referenceCode && (
          <div className="receipt-row">
            <span>GCash Reference:</span>
            <span>{sale.referenceCode}</span>
          </div>
        )}
        {sale.paymentMethod === 'credit' && (
          <>
            <div className="receipt-row">
              <span>Credit Status:</span>
              <span>{sale.creditStatus ? 
                (sale.creditStatus.charAt(0).toUpperCase() + sale.creditStatus.slice(1)) : 
                'Pending'}</span>
            </div>
            <div className="receipt-row">
              <span>Amount Paid:</span>
              <span>₱{(sale.amountPaid || 0).toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Balance:</span>
              <span>₱{(sale.total - (sale.amountPaid || 0)).toFixed(2)}</span>
            </div>
            {sale.dueDate && (
              <div className="receipt-row">
                <span>Due Date:</span>
                <span>{formatDate(sale.dueDate)}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="receipt-divider"></div>
      
      <div className="receipt-items">
        <div className="receipt-item header">
          <div className="item-name">Item</div>
          <div className="item-qty">Qty</div>
          <div className="item-price">Price</div>
          <div className="item-total">Total</div>
        </div>
        
        {saleItems.map((item, index) => (
          <div className="receipt-item" key={index}>
            <div className="item-name">
              {item.productName}
              <div className="item-sku">{item.sku}</div>
              {item.discountAmount > 0 && (
                <div className="item-discount-info">
                  {item.discountPercent > 0 && `${item.discountPercent.toFixed(0)}% off `}
                  (-₱{item.discountAmount.toFixed(2)})
                </div>
              )}
            </div>
            <div className="item-qty">{item.quantity}</div>
            <div className="item-price">
              {item.originalPrice && item.originalPrice !== item.price ? (
                <>
                  <div className="original-price">₱{item.originalPrice.toFixed(2)}</div>
                  <div className="discounted-price">₱{item.price.toFixed(2)}</div>
                </>
              ) : (
                <>₱{item.price.toFixed(2)}</>
              )}
            </div>
            <div className="item-total">₱{item.subtotal.toFixed(2)}</div>
          </div>
        ))}
      </div>
      
      <div className="receipt-divider"></div>
      
      <div className="receipt-summary">
        {sale.originalTotal && sale.originalTotal > sale.total && (
          <div className="receipt-row">
            <span>Original Total:</span>
            <span>₱{sale.originalTotal.toFixed(2)}</span>
          </div>
        )}
        {sale.discountTotal && sale.discountTotal > 0 && (
          <div className="receipt-row discount">
            <span>Discount:</span>
            <span>-₱{sale.discountTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="receipt-row">
          <span>Subtotal:</span>
          <span>₱{sale.total.toFixed(2)}</span>
        </div>
        <div className="receipt-row">
          <span>Tax:</span>
          <span>₱0.00</span>
        </div>
        <div className="receipt-row total">
          <span>Total:</span>
          <span>₱{sale.total.toFixed(2)}</span>
        </div>
        {sale.paymentMethod === 'cash' && (
          <>
            <div className="receipt-row">
              <span>Amount Paid:</span>
              <span>₱{(sale.amountPaid || sale.total).toFixed(2)}</span>
            </div>
            {change > 0 && (
              <div className="receipt-row change">
                <span>Change:</span>
                <span>₱{change.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="receipt-footer">
        <div className="receipt-divider"></div>
        <p>Thank you for your purchase!</p>
        <p>Please come again</p>
      </div>
    </div>
  );
};

export default Receipt;
