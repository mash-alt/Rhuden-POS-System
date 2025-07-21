import { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Customer, CreateCustomer } from '../types'

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const customersQuery = query(
      collection(db, 'customers'),
      orderBy('name', 'asc')
    )

    const unsubscribe = onSnapshot(customersQuery, 
      (querySnapshot) => {
        const customersData: Customer[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          customersData.push({
            id: doc.id,
            name: data.name,
            contact: data.contact || '',
            address: data.address || '',
            creditBalance: data.creditBalance || 0,
            creditAgreements: data.creditAgreements || [],
            joinDate: data.joinDate || null,
            lastPaymentDate: data.lastPaymentDate || null,
          })
        })
        
        setCustomers(customersData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching customers:', error)
        setError('Failed to load customers')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addCustomer = async (customerData: CreateCustomer) => {
    try {
      const customer = {
        ...customerData,
        creditBalance: customerData.creditBalance || 0,
        creditAgreements: customerData.creditAgreements || []
      }
      
      await addDoc(collection(db, 'customers'), customer)
      console.log('Customer added successfully')
    } catch (error) {
      console.error('Error adding customer:', error)
      throw error
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const updateData = { ...updates }
      delete (updateData as any).id
      
      await updateDoc(doc(db, 'customers', id), updateData)
      console.log('Customer updated successfully')
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  const deleteCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id))
      console.log('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw error
    }
  }

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id)
  }

  const searchCustomers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return customers
    }

    const term = searchTerm.toLowerCase().trim()
    
    return customers.filter(customer => {
      return customer.name.toLowerCase().includes(term) ||
             (customer.contact && customer.contact.toLowerCase().includes(term)) ||
             (customer.address && customer.address.toLowerCase().includes(term))
    })
  }

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    searchCustomers
  }
}

export default useCustomers
