import { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useCustomers from '../hooks/useCustomers';
import useSales from '../hooks/useSales';
import { usePayments } from '../hooks/usePayments';
import CreditPaymentSchedule from '../components/CreditPaymentSchedule';
import type { Customer, CreditAgreement } from '../types';
import '../styles/CreditPayments.css';

const CreditPayments = () => {
  const { customers, loading: customersLoading } = useCustomers();
  const { sales } = useSales();
  const { addPayment } = usePayments();

  // Credit payment state
  const [creditPaymentAmount, setCreditPaymentAmount] = useState<string>("");
  const [creditPaymentMethod, setCreditPaymentMethod] = useState<"cash" | "gcash" | "transfer" | "check">("cash");
  const [creditPaymentReference, setCreditPaymentReference] = useState("");
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<Customer | null>(null);
  const [expandedAgreements, setExpandedAgreements] = useState<Set<string>>(new Set());

  // Get customers with outstanding credit balance
  const customersWithCredit = customers.filter(customer => (customer.creditBalance || 0) > 0);

  // Debug logging for customers
  useEffect(() => {
    console.log("=== CREDIT PAYMENTS PAGE ===");
    console.log("Total customers:", customers.length);
    console.log("Customers with credit:", customersWithCredit.length);
    
    customersWithCredit.forEach((customer, index) => {
      console.log(`Customer ${index + 1}:`, {
        id: customer.id,
        name: customer.name,
        creditBalance: customer.creditBalance,
        creditAgreements: customer.creditAgreements?.length || 0,
      });
    });
    console.log("=== END CREDIT PAYMENTS DEBUG ===");
  }, [customers, customersWithCredit]);

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

          // Check if paymentDates array exists
          if (!agreement.paymentDates || agreement.paymentDates.length === 0) {
            console.log(`  - No payment dates found, will need to calculate them`);
          } else {
            console.log(`  - Payment Dates: ${agreement.paymentDates.length} dates`);
            agreement.paymentDates.forEach((date, i) => {
              console.log(`    - Payment ${i + 1}: ${date.toDate().toLocaleDateString()}`);
            });
          }
        });
      }
      console.log("=== END CUSTOMER DEBUG ===");
    } else {
      console.log("No credit customer selected");
    }
  }, [selectedCreditCustomer]);
  
  // Generate payment dates for agreements that don't have them
  useEffect(() => {
    const generatePaymentDates = (agreement: CreditAgreement) => {
      if (!agreement.paymentDates || agreement.paymentDates.length === 0) {
        const paymentDates: Timestamp[] = [];
        const startDate = agreement.startDate.toDate();
        
        console.log("==== PAYMENT DATE CALCULATION LOG ====");
        console.log(`Agreement ID: ${agreement.id}`);
        console.log(`Start Date: ${startDate.toLocaleDateString()}`);
        console.log(`Total Terms: ${agreement.totalTerms}`);
        console.log(`Due Date: ${agreement.dueDate ? agreement.dueDate.toDate().toLocaleDateString() : 'Not set'}`);
        
        // Create entry for each payment term
        let previousDate = new Date(startDate); // Start with the agreement start date
        
        for (let i = 0; i < agreement.totalTerms; i++) {
          // Each payment is exactly 30 days after the previous date
          const dueDate = new Date(previousDate);
          dueDate.setDate(dueDate.getDate() + 30); // Always add 30 days
          
          if (i === 0) {
            console.log(`Term ${i+1}: First payment - Start date: ${startDate.toLocaleDateString()} + 30 days = ${dueDate.toLocaleDateString()}`);
          } else {
            console.log(`Term ${i+1}: Previous date: ${previousDate.toLocaleDateString()} + 30 days = ${dueDate.toLocaleDateString()}`);
          }
          
          paymentDates.push(Timestamp.fromDate(dueDate));
          // Update previous date for next calculation
          previousDate = new Date(dueDate);
        }
        
        console.log("Final Payment Schedule:");
        paymentDates.forEach((date, index) => {
          console.log(`Payment ${index+1}: ${date.toDate().toLocaleDateString()}`);
          
          // Verify the days between payments if there's a previous payment
          if (index > 0) {
            const daysBetween = Math.floor(
              (date.toDate().getTime() - paymentDates[index-1].toDate().getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            console.log(`  Days between payment ${index} and ${index+1}: ${daysBetween} days`);
          }
        });
        console.log("==== END PAYMENT DATE CALCULATION ====");
        
        return paymentDates;
      }
      return agreement.paymentDates;
    };

    if (selectedCreditCustomer && selectedCreditCustomer.creditAgreements) {
      // Check if any agreement is missing payment dates
      let needsUpdate = false;
      const updatedAgreements = selectedCreditCustomer.creditAgreements.map(agreement => {
        if (!agreement.paymentDates || agreement.paymentDates.length === 0) {
          needsUpdate = true;
          return {
            ...agreement,
            paymentDates: generatePaymentDates(agreement)
          };
        }
        return agreement;
      });

      // If any agreements were updated, save to database
      if (needsUpdate && selectedCreditCustomer.id) {
        console.log("Updating agreements with payment dates...");
        updateDoc(doc(db, "customers", selectedCreditCustomer.id), {
          creditAgreements: updatedAgreements
        }).then(() => {
          console.log("Updated payment dates for agreements");
          // Update local state to reflect changes
          setSelectedCreditCustomer({
            ...selectedCreditCustomer,
            creditAgreements: updatedAgreements
          });
        }).catch(error => {
          console.error("Error updating payment dates:", error);
        });
      }
    }
  }, [selectedCreditCustomer]);

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
  
  // Handle marking a payment as paid/unpaid
  const handleMarkPayment = async (agreementId: string, paymentIndex: number, isPaid: boolean) => {
    if (!selectedCreditCustomer) return;
    
    try {
      // Find the agreement in the customer's credit agreements
      const updatedAgreements = [...(selectedCreditCustomer.creditAgreements || [])];
      const agreementIndex = updatedAgreements.findIndex(a => a.id === agreementId);
      
      if (agreementIndex === -1) {
        console.error("Agreement not found:", agreementId);
        return;
      }
      
      const agreement = updatedAgreements[agreementIndex];
      
      // Update payment history based on isPaid status
      if (isPaid) {
        // Add a dummy payment record if marking as paid
        // In a real implementation, you would create a proper payment record
        if (!agreement.paymentHistory) {
          agreement.paymentHistory = [];
        }
        
        // Add a payment if we need more payments to mark this as paid
        if (agreement.paymentHistory.length <= paymentIndex) {
          // Create a dummy payment ID (you'd normally create a real payment record)
          const dummyPaymentId = `manual-${Date.now()}`;
          agreement.paymentHistory.push(dummyPaymentId);
        }
      } else {
        // Remove a payment if unmarking as paid
        if (agreement.paymentHistory && agreement.paymentHistory.length > paymentIndex) {
          agreement.paymentHistory.splice(paymentIndex, 1);
        }
      }
      
      // Update remaining balance and terms based on payments made
      const paidPayments = agreement.paymentHistory.length;
      agreement.remainingTerms = Math.max(0, agreement.totalTerms - paidPayments);
      agreement.remainingBalance = Math.max(0, agreement.principalAmount - (paidPayments * agreement.monthlyPayment));
      
      // Update status based on remaining balance
      if (agreement.remainingBalance <= 0) {
        agreement.status = 'completed';
      } else {
        agreement.status = 'active';
      }
      
      // Update the next payment due date if needed
      if (agreement.status === 'active' && agreement.paymentDates && agreement.paymentDates.length > paidPayments) {
        agreement.nextPaymentDue = agreement.paymentDates[paidPayments];
      }
      
      // Update customer credit balance
      const newCreditBalance = updatedAgreements.reduce(
        (total, a) => total + a.remainingBalance, 
        0
      );
      
      // Update in database
      await updateDoc(doc(db, "customers", selectedCreditCustomer.id), {
        creditAgreements: updatedAgreements,
        creditBalance: newCreditBalance
      });
      
      // Also update the credit agreement document
      if (agreement.id) {
        await updateDoc(doc(db, "creditAgreements", agreement.id), {
          remainingBalance: agreement.remainingBalance,
          paymentHistory: agreement.paymentHistory,
          status: agreement.status,
          remainingTerms: agreement.remainingTerms,
          nextPaymentDue: agreement.nextPaymentDue,
        });
      }
      
      // Update local state
      setSelectedCreditCustomer({
        ...selectedCreditCustomer,
        creditAgreements: updatedAgreements,
        creditBalance: newCreditBalance
      });
      
      console.log(`Payment ${paymentIndex + 1} marked as ${isPaid ? 'paid' : 'unpaid'} for agreement ${agreementId}`);
      
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to update payment status!");
    }
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

  if (customersLoading) {
    return <div className="credit-payments-loading">Loading credit payments...</div>;
  }

  return (
    <div className="credit-payments-container">
      {/* Header */}
      <div className="credit-payments-header">
        <h1>Credit Payments</h1>
        <p>Process payments for credit sales and manage customer agreements</p>
      </div>

      <div className="credit-payments-content">
        {/* Credit Payment Form */}
        <div className="credit-payment-form-section">
          <div className="section-header">
            <h2>Process Payment</h2>
            <p>Select a customer and process their credit payment</p>
          </div>

          <div className="credit-payment-form">
            <div className="form-grid">
              {/* Customer Selection */}
              <div className="form-group">
                <label>Select Customer:</label>
                <select
                  value={selectedCreditCustomer?.id || ""}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    const customer = customersWithCredit.find(c => c.id === customerId);
                    setSelectedCreditCustomer(customer || null);
                    // Clear form when customer changes
                    setCreditPaymentAmount("");
                    setCreditPaymentReference("");
                    setExpandedAgreements(new Set());
                  }}
                  className="customer-select"
                >
                  <option value="">-- Select Customer --</option>
                  {customersWithCredit.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - ₱{(customer.creditBalance || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Amount */}
              <div className="form-group">
                <label>Payment Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedCreditCustomer?.creditBalance || 0}
                  value={creditPaymentAmount}
                  onChange={(e) => setCreditPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="payment-amount-input"
                />
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  value={creditPaymentMethod}
                  onChange={(e) => setCreditPaymentMethod(e.target.value as "cash" | "gcash" | "transfer" | "check")}
                  className="payment-method-select"
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>

              {/* Reference Number */}
              {(creditPaymentMethod === "gcash" || creditPaymentMethod === "transfer" || creditPaymentMethod === "check") && (
                <div className="form-group">
                  <label>
                    {creditPaymentMethod === "gcash" && "GCash Reference:"}
                    {creditPaymentMethod === "transfer" && "Transfer Reference:"}
                    {creditPaymentMethod === "check" && "Check Number:"}
                  </label>
                  <input
                    type="text"
                    value={creditPaymentReference}
                    onChange={(e) => setCreditPaymentReference(e.target.value)}
                    placeholder={`Enter ${creditPaymentMethod} reference`}
                    className="reference-input"
                  />
                </div>
              )}

              {/* Process Payment Button */}
              <div className="form-group process-payment-group">
                <button
                  onClick={processCreditPayment}
                  disabled={!selectedCreditCustomer || !creditPaymentAmount}
                  className="process-payment-btn"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Information Card */}
        <div className="credit-info-section">
          <div className="section-header">
            <h2>Credit Information</h2>
            <p>View customer credit details and agreements</p>
          </div>

          <div className="credit-info-card">
            {selectedCreditCustomer ? (
              <div className="customer-credit-details">
                <div className="customer-summary">
                  <h3>{selectedCreditCustomer.name}</h3>
                  {selectedCreditCustomer.contact && (
                    <p className="customer-contact">Contact: {selectedCreditCustomer.contact}</p>
                  )}
                  <div className="credit-summary">
                    <div className="credit-balance">
                      <span className="label">Outstanding Balance:</span>
                      <span className="amount">₱{(selectedCreditCustomer.creditBalance || 0).toFixed(2)}</span>
                    </div>
                    <div className="agreements-count">
                      <span className="label">Credit Agreements:</span>
                      <span className="count">{selectedCreditCustomer.creditAgreements?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Credit Agreements */}
                {selectedCreditCustomer.creditAgreements && selectedCreditCustomer.creditAgreements.length > 0 && (
                  <div className="credit-agreements">
                    <h4>Credit Agreements</h4>
                    {selectedCreditCustomer.creditAgreements.map((agreement, index) => (
                      <div key={agreement.id || index} className={`agreement-card ${agreement.status}`}>
                        <div 
                          className="agreement-header"
                          onClick={() => agreement.id && toggleAgreementExpansion(agreement.id)}
                        >
                          <div className="agreement-summary">
                            <span className="agreement-title">Agreement #{index + 1}</span>
                            <span className={`agreement-status ${agreement.status}`}>
                              {agreement.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="agreement-amounts">
                            <span className="remaining-balance">
                              ₱{agreement.remainingBalance.toFixed(2)} remaining
                            </span>
                            <span className="expand-icon">
                              {agreement.id && expandedAgreements.has(agreement.id) ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>
                        
                        {agreement.id && expandedAgreements.has(agreement.id) && (
                          <div className="agreement-details">
                            {/* Payment Schedule Timeline - Moved above other details */}
                            <div className="payment-schedule-container">
                              <h4>Payment Schedule</h4>
                              <div>
                                <button 
                                  onClick={() => console.log("Logging payment schedule for agreement:", agreement)}
                                  style={{ 
                                    fontSize: '12px', 
                                    padding: '4px 8px', 
                                    marginBottom: '10px',
                                    background: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Debug: Log Payment Schedule
                                </button>
                                <CreditPaymentSchedule 
                                  agreement={agreement}
                                />
                              </div>
                            </div>
                            
                            <h4 className="details-section-title">Agreement Details</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">Principal Amount:</span>
                                <span className="detail-value">₱{agreement.principalAmount.toFixed(2)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Remaining Balance:</span>
                                <span className="detail-value">₱{agreement.remainingBalance.toFixed(2)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Monthly Payment:</span>
                                <span className="detail-value">₱{agreement.monthlyPayment.toFixed(2)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Remaining Terms:</span>
                                <span className="detail-value">{agreement.remainingTerms} / {agreement.totalTerms}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Start Date:</span>
                                <span className="detail-value">{agreement.startDate.toDate().toLocaleDateString()}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Due Date:</span>
                                <span className="detail-value">{agreement.dueDate.toDate().toLocaleDateString()}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Next Payment Due:</span>
                                <span className="detail-value">{agreement.nextPaymentDue.toDate().toLocaleDateString()}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Payments Made:</span>
                                <span className="detail-value">{agreement.paymentHistory.length}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-customer-selected">
                <div className="placeholder-icon">💳</div>
                <h3>No Customer Selected</h3>
                <p>Select a customer from the dropdown to view their credit information and process payments.</p>
                {customersWithCredit.length === 0 && (
                  <div className="no-credit-customers">
                    <p><strong>No customers with outstanding credit found.</strong></p>
                    <p>Credit customers will appear here when they have unpaid balances.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPayments;
