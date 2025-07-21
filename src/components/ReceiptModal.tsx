import React, { useRef, useState } from 'react';
import type { Sale, Product, Customer } from '../types';
import Receipt from './Receipt';
import '../styles/Receipt.css';

interface ReceiptModalProps {
  show: boolean;
  onClose: () => void;
  sale: Sale;
  products: Product[];
  customer: Customer | null;
  change: number;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  show, 
  onClose, 
  sale, 
  products, 
  customer,
  change 
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  if (!show) {
    return null;
  }

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Create a new window or iframe for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert("Please allow popups for this website to print receipts.");
      setIsPrinting(false);
      return;
    }
    
    // Write the receipt content to the new window
    if (receiptRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Rhuden Building Supply</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                margin: 0;
                padding: 20px;
              }
              .receipt {
                width: 300px;
                margin: 0 auto;
                padding: 20px;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 15px;
              }
              .receipt-header h1 {
                font-size: 18px;
                margin: 0 0 5px 0;
                font-weight: bold;
              }
              .receipt-divider {
                border-bottom: 1px dashed #000;
                margin: 10px 0;
              }
              .receipt-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
              }
              .receipt-item {
                display: grid;
                grid-template-columns: 3fr 1fr 1.5fr 1.5fr;
                gap: 5px;
                font-size: 11px;
                margin-bottom: 6px;
              }
              .item-name { font-size: 11px; }
              .item-sku { font-size: 9px; color: #555; }
              .item-qty { text-align: center; }
              .item-price, .item-total { text-align: right; }
              .receipt-summary .total { font-weight: bold; }
              .receipt-footer { text-align: center; margin-top: 15px; }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
        </html>
      `);
      
      // Wait for the content to load then print
      printWindow.document.close();
      
      // Print after content is loaded
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        
        // Handle print completion or cancellation
        const checkWindowClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkWindowClosed);
            setIsPrinting(false);
          }
        }, 500);
      };
    }
  };

  return (
    <div className="receipt-modal">
      <div className="receipt-modal-content">
        <div ref={receiptRef} id="receipt-to-print">
          <Receipt 
            sale={sale} 
            products={products} 
            customer={customer}
            change={change} 
          />
        </div>
        
        <div className="receipt-modal-actions">
          <button 
            className="print-button" 
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <i className="fas fa-print"></i> {isPrinting ? 'Printing...' : 'Print Receipt'}
          </button>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
