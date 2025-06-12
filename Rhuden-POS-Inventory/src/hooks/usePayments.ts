import { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Payment, CreatePayment } from '../types'

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(paymentsQuery, 
      (querySnapshot) => {
        const paymentsData: Payment[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          paymentsData.push({
            id: doc.id,
            saleId: data.saleId,
            customerId: data.customerId,
            amount: data.amount,
            date: data.date,
            paymentMethod: data.paymentMethod,
            referenceCode: data.referenceCode,
            receiptNumber: data.receiptNumber,
            gcashReferenceNumber: data.gcashReferenceNumber,
            gcashSenderNumber: data.gcashSenderNumber,
            checkNumber: data.checkNumber,
            notes: data.notes
          })
        })
        
        setPayments(paymentsData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching payments:', error)
        setError('Failed to load payments')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addPayment = async (paymentData: CreatePayment) => {
    try {
      const payment = {
        ...paymentData,
        date: paymentData.date || Timestamp.now(),
      }
      
      const docRef = await addDoc(collection(db, 'payments'), payment)
      console.log('Payment added successfully with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error adding payment:', error)
      throw error
    }
  }

  const getPaymentsBySale = (saleId: string) => {
    return payments.filter(payment => 
      typeof payment.saleId === 'string' ? payment.saleId === saleId : payment.saleId.id === saleId
    )
  }

  const getPaymentsByCustomer = (customerId: string) => {
    return payments.filter(payment => 
      payment.customerId && 
      (typeof payment.customerId === 'string' ? payment.customerId === customerId : payment.customerId.id === customerId)
    )
  }

  const getPaymentsByDateRange = (startDate: Date, endDate: Date) => {
    return payments.filter(payment => {
      const paymentDate = payment.date.toDate()
      return paymentDate >= startDate && paymentDate <= endDate
    })
  }

  const getTodaysPayments = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    return getPaymentsByDateRange(startOfDay, endOfDay)
  }

  const getTotalPaymentsAmount = (paymentsList: Payment[] = payments) => {
    return paymentsList.reduce((total, payment) => total + payment.amount, 0)
  }

  return {
    payments,
    loading,
    error,
    addPayment,
    getPaymentsBySale,
    getPaymentsByCustomer,
    getPaymentsByDateRange,
    getTodaysPayments,
    getTotalPaymentsAmount
  }
}

export default usePayments