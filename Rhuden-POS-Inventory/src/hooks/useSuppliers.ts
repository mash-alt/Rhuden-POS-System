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
import type { Supplier } from '../types'

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const suppliersQuery = query(
      collection(db, 'suppliers'),
      orderBy('name', 'asc')
    )

    const unsubscribe = onSnapshot(suppliersQuery, 
      (querySnapshot) => {
        const suppliersData: Supplier[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          suppliersData.push({
            id: doc.id,
            name: data.name,
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            notes: data.notes || ''
          })
        })
        
        setSuppliers(suppliersData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Error fetching suppliers:', error)
        setError('Failed to load suppliers')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), {
        name: supplierData.name,
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        address: supplierData.address || '',
        notes: supplierData.notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      console.log('Supplier added with ID: ', docRef.id)
    } catch (error) {
      console.error('Error adding supplier:', error)
      throw new Error('Failed to add supplier')
    }
  }

  const updateSupplier = async (supplierId: string, supplierData: Omit<Supplier, 'id'>) => {
    try {
      const supplierRef = doc(db, 'suppliers', supplierId)
      await updateDoc(supplierRef, {
        name: supplierData.name,
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        address: supplierData.address || '',
        notes: supplierData.notes || '',
        updatedAt: new Date()
      })
      
      console.log('Supplier updated: ', supplierId)
    } catch (error) {
      console.error('Error updating supplier:', error)
      throw new Error('Failed to update supplier')
    }
  }

  const deleteSupplier = async (supplierId: string) => {
    try {
      const supplierRef = doc(db, 'suppliers', supplierId)
      await deleteDoc(supplierRef)
      
      console.log('Supplier deleted: ', supplierId)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      throw new Error('Failed to delete supplier')
    }
  }

  const searchSuppliers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return suppliers;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return suppliers.filter(supplier => {
      // Search in name
      if (supplier.name.toLowerCase().includes(term)) return true;
      
      // Search in email
      if (supplier.email && supplier.email.toLowerCase().includes(term)) return true;
      
      // Search in phone
      if (supplier.phone && supplier.phone.toLowerCase().includes(term)) return true;
      
      // Search in address
      if (supplier.address && supplier.address.toLowerCase().includes(term)) return true;
      
      return false;
    });
  };

  return {
    suppliers,
    loading,
    error,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers
  }
}