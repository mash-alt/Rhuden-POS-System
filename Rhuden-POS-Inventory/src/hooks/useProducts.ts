import { useState, useEffect } from 'react'
import { collection, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Product } from '../types'

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Create a query to get products ordered by name
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('name', 'asc')
        )
          // Set up real-time listener
        unsubscribe = onSnapshot(productsQuery, (querySnapshot) => {
          const productsData: Product[] = []
          
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            productsData.push({
              id: doc.id,
              name: data.name,
              sku: data.sku,
              price: data.price,
              cost: data.cost,
              description: data.description,              categoryId: typeof data.categoryId === 'string' ? data.categoryId : (data.categoryId as any)?.id,
              supplierId: typeof data.supplierId === 'string' ? data.supplierId : (data.supplierId as any)?.id,
              stockQuantity: data.stockQuantity,
              reorderLevel: data.reorderLevel,
              unit: data.unit,
              active: data.active,
              createdAt: data.createdAt
            })
          })
          
          setProducts(productsData)
          setLoading(false)
        }, (error) => {
          console.error('Error fetching products:', error)
          setError('Failed to load products')
          setLoading(false)
        })
      } catch (error) {
        console.error('Error setting up products listener:', error)
        setError('Failed to initialize products')
        setLoading(false)
      }
    }

    fetchProducts()
      // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      // Convert DocumentReference objects to IDs if they exist
      const productData = {
        ...product,
        // Ensure categoryId and supplierId are strings
        categoryId: typeof product.categoryId === 'string' 
          ? product.categoryId 
          : (product.categoryId as any)?.id || product.categoryId,
        supplierId: typeof product.supplierId === 'string' 
          ? product.supplierId 
          : (product.supplierId as any)?.id || product.supplierId,
        createdAt: new Date(),
        active: product.active !== false // Default to true if not specified
      }
      
      await addDoc(collection(db, 'products'), productData)
      console.log('Product added successfully')    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // Convert DocumentReference objects to IDs if they exist
      const updateData: any = { ...updates }
      
      // Ensure categoryId and supplierId are strings, not DocumentReference objects
      if (updateData.categoryId) {
        updateData.categoryId = typeof updateData.categoryId === 'string' 
          ? updateData.categoryId 
          : (updateData.categoryId as any)?.id || updateData.categoryId
      }
      
      if (updateData.supplierId) {
        updateData.supplierId = typeof updateData.supplierId === 'string' 
          ? updateData.supplierId 
          : (updateData.supplierId as any)?.id || updateData.supplierId
      }
      
      // Remove id from updates to avoid Firestore errors
      delete updateData.id
      
      await updateDoc(doc(db, 'products', id), updateData)
      console.log('Product updated successfully')
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id))
      console.log('Product deleted successfully')
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  const getProductById = (id: string) => {
    return products.find(product => product.id === id)
  }

  // Enhanced search functionality
  const searchProducts = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return products
    }

    const term = searchTerm.toLowerCase().trim()
    
    return products.filter(product => {
      // Search in name
      if (product.name.toLowerCase().includes(term)) return true
      
      // Search in SKU
      if (product.sku.toLowerCase().includes(term)) return true
      
      // Search in description
      if (product.description && product.description.toLowerCase().includes(term)) return true
      
      // Search in unit
      if (product.unit && product.unit.toLowerCase().includes(term)) return true
      
      return false
    })
  }

  // Get products with low stock
  const getLowStockProducts = () => {
    return products.filter(product => 
      product.stockQuantity !== undefined && 
      product.reorderLevel !== undefined && 
      product.stockQuantity <= product.reorderLevel
    )
  }

  // Get total inventory value
  const getTotalValue = () => {
    return products.reduce((total, product) => {
      const quantity = product.stockQuantity || 0
      const cost = product.cost || product.price
      return total + (quantity * cost)
    }, 0)
  }

  // Get total retail value
  const getTotalRetailValue = () => {
    return products.reduce((total, product) => {
      const quantity = product.stockQuantity || 0
      return total + (quantity * product.price)
    }, 0)
  }

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    searchProducts,
    getLowStockProducts,
    getTotalValue,
    getTotalRetailValue
  }
}

export default useProducts
