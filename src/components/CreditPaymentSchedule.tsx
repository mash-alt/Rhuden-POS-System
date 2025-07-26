import React from 'react';
import type { CreditAgreement } from '../types';

// Styles for credit payment schedule
const styles = `
  .credit-payment-schedule {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    padding: 12px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: none;
  }
  
  .schedule-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    gap: 6px;
  }
  
  .schedule-header h4 {
    margin: 0;
    color: #374151;
    font-size: 14px;
  }
  
  .agreement-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    width: 100%;
    background-color: #f9fafb;
    padding: 8px;
    border-radius: 4px;
  }
  
  .agreement-details p {
    margin: 0;
    color: #64748b;
    line-height: 1.3;
  }
  
  .schedule-timeline {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .schedule-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 4px;
    background-color: #fafafa;
    border-left: 2px solid #e0e0e0;
    margin-bottom: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    width: 100%;
    transition: all 0.2s ease;
  }
  
  .schedule-item:hover {
    background-color: #f5f5f5;
  }
  
  .schedule-item:nth-child(odd) {
    background-color: #f1f3f5;
  }
  
  .schedule-item .payment-number {
    font-weight: 500;
    font-size: 10px;
    color: #475569;
    width: auto;
    background-color: #e5e7eb;
    padding: 2px 6px;
    border-radius: 10px;
    text-align: center;
    display: inline-block;
    margin-bottom: 1px;
    letter-spacing: 0.3px;
  }
  
  .schedule-item .payment-date {
    font-size: 12px;
    color: #334155;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 100%;
    background-color: white;
    padding: 6px;
    border-radius: 4px;
    border: none;
    text-align: center;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  }
  
  .schedule-item .payment-amount {
    font-weight: 600;
    color: #0f766e;
    font-size: 13px;
    background-color: #f0fdfa;
    padding: 6px 8px;
    border-radius: 4px;
    width: auto;
    text-align: center;
    border: none;
    box-shadow: none;
    margin-top: 0;
    letter-spacing: 0.3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    float: right;
  }
  
  .schedule-item .payment-amount::before {
    content: "₱";
    margin-right: 2px;
    opacity: 0.8;
    font-size: 11px;
  }
  
  .status-paid {
    color: #16a34a;
    background-color: #dcfce7;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 11px;
    width: auto;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    border: none;
    box-shadow: none;
  }
  
  .status-paid::before {
    content: "✓";
    display: inline-block;
    margin-right: 4px;
    font-size: 10px;
  }
  
  .status-overdue {
    color: #dc2626;
    background-color: #fee2e2;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 11px;
    width: auto;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    border: none;
    box-shadow: none;
  }
  
  .status-overdue::before {
    content: "!";
    display: inline-block;
    margin-right: 4px;
    font-size: 10px;
    width: 12px;
    height: 12px;
    line-height: 12px;
    text-align: center;
    border-radius: 50%;
    background-color: #dc2626;
    color: white;
  }
  
  .status-due-soon {
    color: #d97706;
    background-color: #fef3c7;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 11px;
    width: auto;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    border: none;
    box-shadow: none;
  }
  
  .status-due-soon::before {
    content: "⏰";
    display: inline-block;
    margin-right: 4px;
    font-size: 10px;
  }
  
  .status-upcoming {
    color: #0891b2;
    background-color: #e0f2fe;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 11px;
    width: auto;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    border: none;
    box-shadow: none;
  }
  
  .status-upcoming::before {
    content: "→";
    display: inline-block;
    margin-right: 4px;
    font-size: 10px;
  }
  
  .status-pending {
    color: #64748b;
    background-color: #f1f5f9;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 11px;
    width: auto;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    border: none;
    box-shadow: none;
  }
  
  .status-pending::before {
    content: "○";
    display: inline-block;
    margin-right: 4px;
    font-size: 10px;
  }
  
  .toggleable {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .toggleable:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .toggle-payment-btn {
    margin-left: 8px;
    background: none;
    border: 1px solid #ccc;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .toggle-payment-btn:hover {
    background-color: #edf2f7;
  }
  
  /* Responsive styles for smaller screens */
  @media (max-width: 768px) {
    .schedule-item {
      gap: 12px;
      padding: 16px;
    }
    
    .schedule-item .payment-number {
      width: 100%;
      font-size: 14px;
    }
    
    .schedule-item .payment-date {
      width: 100%;
      font-size: 14px;
    }
    
    .schedule-item .payment-amount {
      margin-top: 8px;
      width: 100%;
      font-size: 16px;
    }
    
    .status-paid,
    .status-overdue,
    .status-due-soon,
    .status-upcoming,
    .status-pending {
      font-size: 13px;
      padding: 8px 10px;
    }
    
    .credit-payment-schedule {
      padding: 16px;
    }
  }
  }
`;

// Utility functions for payment dates
const isPaymentDueSoon = (dueDate: Date): boolean => {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  return dueDate >= today && dueDate <= sevenDaysFromNow;
};

const isPaymentOverdue = (dueDate: Date): boolean => {
  const today = new Date();
  return dueDate < today;
};

// Function to calculate payment dates from a credit agreement
const calculatePaymentDates = (
  agreement: CreditAgreement
): Array<{ dueDate: Date; amount: number; isPaid: boolean; paymentNumber: number }> => {
  const paymentDates = [];
  const startDate = agreement.startDate.toDate();
  
  console.log("==== PAYMENT SCHEDULE COMPONENT DATE CALCULATION ====");
  console.log(`Agreement ID: ${agreement.id || 'unknown'}`);
  console.log(`Start Date: ${startDate.toLocaleDateString()}`);
  console.log(`Total Terms: ${agreement.totalTerms}`);
  console.log(`Monthly Payment: ${agreement.monthlyPayment}`);
  
  // Create entry for each payment term
  let previousDate = new Date(startDate); // Start with the agreement start date
  
  for (let i = 0; i < agreement.totalTerms; i++) {
    // Each payment is exactly 30 days after the previous one
    const dueDate = new Date(previousDate);
    dueDate.setDate(dueDate.getDate() + 30); // Always add 30 days to previous date
    
    if (i === 0) {
      console.log(`Term ${i+1}: First payment - Start date: ${startDate.toLocaleDateString()} + 30 days = ${dueDate.toLocaleDateString()}`);
    } else {
      console.log(`Term ${i+1}: Previous payment: ${previousDate.toLocaleDateString()} + 30 days = ${dueDate.toLocaleDateString()}`);
    }
    
    // Save this due date as the previous date for the next iteration
    previousDate = new Date(dueDate);
    
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
  
  console.log("Final Payment Schedule in Component:");
  paymentDates.forEach((payment, index) => {
    console.log(`Payment ${index+1}: ${payment.dueDate.toLocaleDateString()} - ${payment.isPaid ? 'Paid' : 'Not Paid'}`);
  });
  console.log("==== END PAYMENT SCHEDULE CALCULATION ====");
  
  return paymentDates;
};

interface CreditPaymentScheduleProps {
  agreement: CreditAgreement;
}

interface CreditPaymentScheduleProps {
  agreement: CreditAgreement;
  // Removed onMarkPayment and editable since we're disabling the toggle functionality
}

const CreditPaymentSchedule: React.FC<CreditPaymentScheduleProps> = ({ 
  agreement
}) => {
  // Calculate payment dates and status - use paymentDates array if available
  const paymentSchedule = agreement.paymentDates 
    ? agreement.paymentDates.map((date, index) => ({
        dueDate: date.toDate(),
        amount: agreement.monthlyPayment,
        isPaid: agreement.paymentHistory && agreement.paymentHistory.length > index,
        paymentNumber: index + 1
      }))
    : calculatePaymentDates(agreement);
  
  // Function to log payment schedule to console
  const logPaymentSchedule = () => {
    console.log(`======== DETAILED PAYMENT SCHEDULE LOG ========`);
    console.log(`Agreement ID: ${agreement.id || 'unknown'}`);
    console.log(`Principal Amount: ₱${agreement.principalAmount.toFixed(2)}`);
    console.log(`Monthly Payment: ₱${agreement.monthlyPayment.toFixed(2)}`);
    console.log(`Remaining Balance: ₱${agreement.remainingBalance.toFixed(2)}`);
    console.log(`Total Terms: ${agreement.totalTerms}`);
    console.log(`Remaining Terms: ${agreement.remainingTerms}`);
    console.log(`Start Date: ${agreement.startDate.toDate().toLocaleDateString()}`);
    console.log(`Due Date: ${agreement.dueDate.toDate().toLocaleDateString()}`);
    console.log(`Next Payment Due: ${agreement.nextPaymentDue.toDate().toLocaleDateString()}`);
    console.log(`Payment History: ${agreement.paymentHistory.length} payments`);
    
    console.log('\nPayment Schedule Details:');
    paymentSchedule.forEach((payment, index) => {
      const dateStr = payment.dueDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
      });
      const status = payment.isPaid ? "PAID" : "NOT PAID";
      console.log(`Payment #${index + 1}: ${dateStr} - ${status} - ₱${payment.amount.toFixed(2)}`);
      
      // Calculate days from start date and days between payments
      const startDateDiff = Math.floor((payment.dueDate.getTime() - agreement.startDate.toDate().getTime()) / (24 * 60 * 60 * 1000));
      const prevPaymentDate = index > 0 ? paymentSchedule[index - 1].dueDate : agreement.startDate.toDate();
      const daysSincePrevPayment = Math.floor((payment.dueDate.getTime() - prevPaymentDate.getTime()) / (24 * 60 * 60 * 1000));
      
      console.log(`   Days from start: ${startDateDiff} days`);
      if (index > 0) {
        console.log(`   Days since previous payment: ${daysSincePrevPayment} days`);
      }
    });
    console.log(`======== END PAYMENT SCHEDULE LOG ========`);
  };
  
  // Toggle payment functionality has been removed as requested
  
  return (
    <div className="credit-payment-schedule">
      <style>{styles}</style>
      {/* Simple button for debugging */}
      <button onClick={logPaymentSchedule} style={{ fontSize: '10px', padding: '2px 5px', marginBottom: '10px' }}>
        Log Schedule
      </button>
      
      <div className="schedule-timeline">
        {paymentSchedule.map((payment, index) => {
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
            <div 
              key={index} 
              className="schedule-item"
            >
              <div className="payment-number">Payment #{payment.paymentNumber}</div>
              <div className="payment-date">
                {payment.dueDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
              <span className={statusClass}>{statusText}</span>
              <div className="payment-amount">
                ₱{payment.amount.toFixed(2)}
                {/* Removed manual toggle button as requested */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreditPaymentSchedule;
