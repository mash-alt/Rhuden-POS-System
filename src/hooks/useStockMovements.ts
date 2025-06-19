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
import type { StockMovement } from '../types'

export const useStockMovements = () => {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stockMovementsQuery = query(
      collection(db, 'stockMovements'),
      orderBy('date', 'desc') // Most recent first
    )

    const unsubscribe = onSnapshot(stockMovementsQuery, 
      (querySnapshot) => {
        const stockMovementsData: StockMovement[] = []
        
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          stockMovementsData.push({
            id: docSnapshot.id,
            productId: data.productId,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            reference: data.reference || '',
            notes: data.notes || '',
            date: data.date,
            userId: data.userId,
            previousStock: data.previousStock,
            newStock: data.newStock
          })
        })
        
        setStockMovements(stockMovementsData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Error fetching stock movements:', error)
        setError('Failed to load stock movements')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addStockMovement = async (stockMovementData: Omit<StockMovement, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'stockMovements'), {
        productId: stockMovementData.productId,
        type: stockMovementData.type,
        quantity: stockMovementData.quantity,
        reason: stockMovementData.reason,
        reference: stockMovementData.reference || '',
        notes: stockMovementData.notes || '',
        date: stockMovementData.date || Timestamp.now(),
        userId: stockMovementData.userId,
        previousStock: stockMovementData.previousStock,
        newStock: stockMovementData.newStock,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      console.log('Stock movement added with ID: ', docRef.id)
    } catch (error) {
      console.error('Error adding stock movement:', error)
      throw new Error('Failed to add stock movement')
    }
  }

  const searchStockMovements = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return stockMovements;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return stockMovements.filter(movement => {
      // Search in reason
      if (movement.reason.toLowerCase().includes(term)) return true;
      
      // Search in reference
      if (movement.reference && movement.reference.toLowerCase().includes(term)) return true;
      
      // Search in notes
      if (movement.notes && movement.notes.toLowerCase().includes(term)) return true;
      
      // Search in type
      if (movement.type.toLowerCase().includes(term)) return true;
      
      return false;
    });
  };

  return {
    stockMovements,
    loading,
    error,
    addStockMovement,
    searchStockMovements
  }
}
