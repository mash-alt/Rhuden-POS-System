import React from 'react'
import type { Category, Product } from '../types'

interface CategoryTableProps {
  categories: Category[]
  products?: Product[]
  onEdit?: (category: Category) => void
  onDelete?: (categoryId: string) => void
  showActions?: boolean
}

const CategoryTable: React.FC<CategoryTableProps> = ({ 
  categories, 
  products = [],
  onEdit, 
  onDelete, 
  showActions = true 
}) => {
  const getProductCount = (categoryId: string) => {
    return products.filter(product => product.categoryId === categoryId).length
  }
  return (
    <div className="product-table-container">
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Products</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 4 : 3} className="no-data">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="name-cell">
                    <div className="category-name">
                      {category.name}
                    </div>
                  </td>
                  <td className="description-cell">
                    {category.description || '-'}
                  </td>                  <td className="count-cell">
                    <span className="product-count">
                      {getProductCount(category.id)}
                    </span>
                  </td>
                  {showActions && (
                    <td className="actions-cell">
                      <div className="action-buttons">
                        {onEdit && (
                          <button
                            className="edit-btn"
                            onClick={() => onEdit(category)}
                            title="Edit category"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="delete-btn"
                            onClick={() => onDelete(category.id)}
                            title="Delete category"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CategoryTable
