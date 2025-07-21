import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Timestamp } from 'firebase/firestore';

/**
 * Creates a test credit payment in the database
 * This is for testing payment type logging in TransactionHistory
 */
export const createTestCreditPayment = async () => {
  try {
    const testPayment = {
      amount: 500,
      date: Timestamp.now(),
      paymentMethod: 'cash',
      paymentType: 'credit_payment', // Explicitly set payment type
      customerId: {
        id: 'test-customer-id',
        // Other reference fields would normally be here
      },
      creditAgreementId: 'test-credit-agreement-id',
      notes: 'Test credit payment for debugging'
    };
    
    const docRef = await addDoc(collection(db, 'payments'), testPayment);
    console.log('Test credit payment created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test payment:', error);
    throw error;
  }
};

/**
 * Creates a test sale payment in the database
 * This is for testing payment type logging in TransactionHistory
 */
export const createTestSalePayment = async () => {
  try {
    const testPayment = {
      amount: 1000,
      date: Timestamp.now(),
      paymentMethod: 'gcash',
      paymentType: 'sale', // Explicitly set payment type
      saleId: {
        id: 'test-sale-id',
        // Other reference fields would normally be here
      },
      notes: 'Test sale payment for debugging'
    };
    
    const docRef = await addDoc(collection(db, 'payments'), testPayment);
    console.log('Test sale payment created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test payment:', error);
    throw error;
  }
};

// Export a function to call both test functions
export const createAllTestTransactions = async () => {
  const creditPaymentId = await createTestCreditPayment();
  const salePaymentId = await createTestSalePayment();
  return { creditPaymentId, salePaymentId };
};
