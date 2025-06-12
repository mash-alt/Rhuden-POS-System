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
import type { Sale, CreateSale } from '../types'

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const salesQuery = query(
      collection(db, 'sales'),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(salesQuery, 
      (querySnapshot) => {
        const salesData: Sale[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          salesData.push({
            id: doc.id,
            items: data.items,
            total: data.total,
            paymentMethod: data.paymentMethod,
            date: data.date,
            customerId: data.customerId,
            creditStatus: data.creditStatus,
            amountPaid: data.amountPaid,
            dueDate: data.dueDate,
            paymentIds: data.paymentIds || []
          })
        })
        
        setSales(salesData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching sales:', error)
        setError('Failed to load sales')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addSale = async (saleData: CreateSale) => {
    try {
      const sale = {
        ...saleData,
        date: saleData.date || Timestamp.now(),
      }
      
      const docRef = await addDoc(collection(db, 'sales'), sale)
      console.log('Sale added successfully with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error adding sale:', error)
      throw error
    }
  }

  const getSalesByCustomer = (customerId: string) => {
    return sales.filter(sale => 
      sale.customerId && 
      (typeof sale.customerId === 'string' ? sale.customerId === customerId : sale.customerId.id === customerId)
    )
  }

  const getSalesByDateRange = (startDate: Date, endDate: Date) => {
    return sales.filter(sale => {
      const saleDate = sale.date.toDate()
      return saleDate >= startDate && saleDate <= endDate
    })
  }

  const getTodaysSales = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    return getSalesByDateRange(startOfDay, endOfDay)
  }

  const getTotalSalesAmount = (salesList: Sale[] = sales) => {
    return salesList.reduce((total, sale) => total + sale.total, 0)
  }

  const getCreditSales = () => {
    return sales.filter(sale => sale.paymentMethod === 'credit')
  }

  const getPendingCreditAmount = () => {
    const creditSales = getCreditSales()
    return creditSales.reduce((total, sale) => {
      const amountPaid = sale.amountPaid || 0
      return total + (sale.total - amountPaid)
    }, 0)
  }

  return {
    sales,
    loading,
    error,
    addSale,
    getSalesByCustomer,
    getSalesByDateRange,
    getTodaysSales,
    getTotalSalesAmount,
    getCreditSales,
    getPendingCreditAmount
  }
}

export default useSales
