import React from 'react'

export interface TableColumn<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  onEdit?: (item: T) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  emptyMessage?: string
  getRowClassName?: (item: T) => string
  getItemId: (item: T) => string
}

function Table<T>({ 
  data, 
  columns,
  onEdit, 
  onDelete, 
  showActions = true,
  emptyMessage = "No data found",
  getRowClassName,
  getItemId
}: TableProps<T>) {
  const colSpan = columns.length + (showActions ? 1 : 0)

  return (
    <div className="product-table-container">
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className}>
                  {column.label}
                </th>
              ))}
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="no-data">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={getItemId(item)} 
                  className={getRowClassName ? getRowClassName(item) : ''}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={column.className}>
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </td>
                  ))}
                  {showActions && (
                    <td className="actions-cell">
                      <div className="action-buttons">
                        {onEdit && (
                          <button
                            className="edit-btn"
                            onClick={() => onEdit(item)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="delete-btn"
                            onClick={() => onDelete(getItemId(item))}
                            title="Delete"
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

export default Table
