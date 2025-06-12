import { useState, useEffect } from 'react'
import { collection, query, orderBy, DocumentReference, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Category } from '../types'

export const useCategories = () => {
  const [categories, setCategories] = useState<(Category & { ref: DocumentReference })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('name', 'asc')
        )
        
        // Set up real-time listener
        unsubscribe = onSnapshot(categoriesQuery, (querySnapshot) => {
          const categoriesData: (Category & { ref: DocumentReference })[] = []
          
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            categoriesData.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              ref: doc.ref
            })
          })
          
          setCategories(categoriesData)
          setLoading(false)
        }, (error) => {
          console.error('Error fetching categories:', error)
          setError('Failed to load categories')
          setLoading(false)        })
      } catch (error) {
        console.error('Error setting up categories listener:', error)
        setError('Failed to initialize categories')
        setLoading(false)
      }
    }

    fetchCategories()
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: new Date()
      })
      console.log('Category added successfully')
    } catch (error) {
      console.error('Error adding category:', error)
      throw error
    }
  }

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    try {
      const categoryRef = doc(db, 'categories', id)
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: new Date()
      })
      console.log('Category updated successfully')
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id))
      console.log('Category deleted successfully')
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id)
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  }
}
