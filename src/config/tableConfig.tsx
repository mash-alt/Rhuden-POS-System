import type { Product, Category, Supplier, StockMovement } from '../types'
import type { TableColumn } from '../components/Table'
import type { FormSection } from '../components/Form'

// Product Table Configuration
export const productTableColumns: TableColumn<Product>[] = [
  {
    key: 'sku',
    label: 'SKU',
    className: 'sku-cell'
  },
  {
    key: 'name',
    label: 'Product Name',
    className: 'name-cell',
    render: (product: Product) => {
      const isLowStock = product.stockQuantity !== undefined && 
                        product.reorderLevel !== undefined && 
                        product.stockQuantity <= product.reorderLevel;
      
      return (
        <div className="product-name">
          {product.name}
          {isLowStock && <span className="low-stock-badge">Low Stock</span>}
        </div>
      )
    }
  },
  {
    key: 'price',
    label: 'Price',
    className: 'price-cell',
    render: (product: Product) => `$${product.price.toFixed(2)}`
  },
  {
    key: 'stockQuantity',
    label: 'Stock',
    className: 'stock-cell',
    render: (product: Product) => {
      const isLowStock = product.stockQuantity !== undefined && 
                        product.reorderLevel !== undefined && 
                        product.stockQuantity <= product.reorderLevel;
      
      return (
        <span className={isLowStock ? 'low-stock' : ''}>
          {product.stockQuantity ?? 0}
        </span>
      )
    }
  },  {
    key: 'unit',
    label: 'Unit',
    className: 'unit-cell'
  },
  {
    key: 'active',
    label: 'Active',
    className: 'active-cell',
    render: (product: Product) => (
      <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
        {product.active ? 'Active' : 'Inactive'}
      </span>
    )
  },
  {
    key: 'status',
    label: 'Status',
    className: 'status-cell',
    render: (product: Product) => {
      const isLowStock = product.stockQuantity !== undefined && 
                        product.reorderLevel !== undefined && 
                        product.stockQuantity <= product.reorderLevel;
      
      return (
        <span className={`status-badge ${isLowStock ? 'low-stock' : 'in-stock'}`}>
          {isLowStock ? 'Low Stock' : 'In Stock'}
        </span>
      )
    }
  },
  {
    key: 'description',
    label: 'Description',
    className: 'description-cell',
    render: (product: Product) => product.description || '-'
  }
]

// Category Table Configuration
export const categoryTableColumns: TableColumn<Category>[] = [
  {
    key: 'name',
    label: 'Name',
    className: 'name-cell'
  },
  {
    key: 'description',
    label: 'Description',
    className: 'description-cell',
    render: (category: Category) => category.description || '-'
  }
]

// Enhanced category columns that include product count
export const createCategoryTableColumns = (products: Product[]): TableColumn<Category>[] => [
  ...categoryTableColumns,
  {
    key: 'productCount',
    label: 'Products',
    className: 'count-cell',
    render: (category: Category) => {
      const count = products.filter(product => product.categoryId === category.id).length
      return <span className="product-count">{count}</span>
    }
  }
]

// Product Form Configuration
export const productFormSections: FormSection[] = [
  {
    title: "Basic Information",
    fields: [
      {
        name: "name",
        label: "Product Name",
        type: "text",
        required: true,
        placeholder: "Enter product name",
        validation: (value) => {
          if (!value || value.trim().length < 2) {
            return "Product name must be at least 2 characters long";
          }
          if (value.trim().length > 100) {
            return "Product name must be less than 100 characters";
          }
          return undefined;
        }
      },
      {
        name: "sku",
        label: "SKU",
        type: "text",
        required: true,
        placeholder: "Enter SKU",
        validation: (value) => {
          if (!value || value.trim().length < 3) {
            return "SKU must be at least 3 characters long";
          }
          if (value.trim().length > 50) {
            return "SKU must be less than 50 characters";
          }
          // Check for valid SKU format (alphanumeric, hyphens, underscores)
          if (!/^[A-Za-z0-9\-_]+$/.test(value.trim())) {
            return "SKU can only contain letters, numbers, hyphens, and underscores";
          }
          return undefined;
        }
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter product description",
        rows: 3,
        validation: (value) => {
          if (value && value.trim().length > 500) {
            return "Description must be less than 500 characters";
          }
          return undefined;
        }
      }
    ]
  },  {
    title: "Pricing",
    fields: [
      {
        name: "price",
        label: "Selling Price",
        type: "number",
        required: true,
        placeholder: "0.00",
        step: "0.01",
        min: "0",
        validation: (value) => {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue <= 0) {
            return "Price must be greater than 0";
          }
          if (numValue > 999999.99) {
            return "Price cannot exceed $999,999.99";
          }
          // Check for reasonable decimal places
          if (value.toString().includes('.') && value.toString().split('.')[1].length > 2) {
            return "Price can have at most 2 decimal places";
          }
          return undefined;
        }
      },
      {
        name: "cost",
        label: "Cost Price",
        type: "number",
        placeholder: "0.00",
        step: "0.01",
        min: "0",
        validation: (value) => {
          if (value === '' || value === null || value === undefined) {
            return undefined; // Optional field
          }
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            return "Cost must be 0 or greater";
          }
          if (numValue > 999999.99) {
            return "Cost cannot exceed $999,999.99";
          }
          // Check for reasonable decimal places
          if (value.toString().includes('.') && value.toString().split('.')[1].length > 2) {
            return "Cost can have at most 2 decimal places";
          }
          return undefined;
        }
      }
    ]
  },  {
    title: "Classification",
    fields: [
      {
        name: "categoryId",
        label: "Category",
        type: "select",
        required: true,
        options: [], // Will be populated dynamically
        validation: (value) => {
          if (!value || value.trim() === '') {
            return "Please select a category";
          }
          return undefined;
        }
      },
      {
        name: "supplierId",
        label: "Supplier",
        type: "select",
        required: true,
        options: [], // Will be populated dynamically
        validation: (value) => {
          if (!value || value.trim() === '') {
            return "Please select a supplier";
          }
          return undefined;
        }
      }
    ]
  },  {
    title: "Inventory",
    fields: [
      {
        name: "stockQuantity",
        label: "Stock Quantity",
        type: "number",
        placeholder: "0",
        min: "0",
        validation: (value) => {
          if (value === '' || value === null || value === undefined) {
            return undefined; // Optional field
          }
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 0) {
            return "Stock quantity cannot be negative";
          }
          if (numValue > 999999) {
            return "Stock quantity cannot exceed 999,999";
          }
          // Check if it's a whole number
          if (!Number.isInteger(parseFloat(value))) {
            return "Stock quantity must be a whole number";
          }
          return undefined;
        }
      },
      {
        name: "reorderLevel",
        label: "Reorder Level",
        type: "number",
        placeholder: "0",
        min: "0",
        validation: (value) => {
          if (value === '' || value === null || value === undefined) {
            return undefined; // Optional field
          }
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 0) {
            return "Reorder level cannot be negative";
          }
          if (numValue > 999999) {
            return "Reorder level cannot exceed 999,999";
          }
          // Check if it's a whole number
          if (!Number.isInteger(parseFloat(value))) {
            return "Reorder level must be a whole number";
          }
          return undefined;
        }
      },
      {
        name: "unit",
        label: "Unit",
        type: "select",
        options: [
          { value: "piece", label: "Piece" },
          { value: "box", label: "Box" },
          { value: "bag", label: "Bag" },
          { value: "roll", label: "Roll" },
          { value: "sheet", label: "Sheet" },
          { value: "rental", label: "Rental" },
          { value: "meter", label: "Meter" },
          { value: "kilogram", label: "Kilogram" },
          { value: "liter", label: "Liter" }
        ],
        validation: (value) => {
          const validUnits = ["piece", "box", "bag", "roll", "sheet", "rental", "meter", "kilogram", "liter"];          if (value && !validUnits.includes(value)) {
            return "Please select a valid unit";
          }
          return undefined;
        }
      },
      {
        name: "active",
        label: "Active Status",
        type: "checkbox"
      }
    ]
  }
]

// Category Form Configuration
export const categoryFormSections: FormSection[] = [
  {
    title: "Category Information",
    fields: [
      {
        name: "name",
        label: "Category Name",
        type: "text",
        required: true,
        placeholder: "Enter category name",
        validation: (value) => {
          if (!value || value.trim().length < 2) {
            return "Category name must be at least 2 characters long";
          }
          if (value.trim().length > 50) {
            return "Category name must be less than 50 characters";
          }
          // Check for valid characters (letters, numbers, spaces, hyphens)
          if (!/^[A-Za-z0-9\s\-&]+$/.test(value.trim())) {
            return "Category name can only contain letters, numbers, spaces, hyphens, and ampersands";
          }
          return undefined;
        }
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter category description",
        rows: 4,
        validation: (value) => {
          if (value && value.trim().length > 250) {
            return "Description must be less than 250 characters";
          }
          return undefined;
        }
      }
    ]
  }
]

// Supplier Table Configuration
export const supplierTableColumns: TableColumn<Supplier>[] = [
  {
    key: 'name',
    label: 'Name',
    className: 'name-cell'
  },
  {
    key: 'email',
    label: 'Email',
    className: 'email-cell',
    render: (supplier: Supplier) => supplier.email || '-'
  },
  {
    key: 'phone',
    label: 'Phone',
    className: 'phone-cell',
    render: (supplier: Supplier) => supplier.phone || '-'
  },
  {
    key: 'address',
    label: 'Address',
    className: 'address-cell',
    render: (supplier: Supplier) => supplier.address || '-'
  }
]

// Enhanced supplier columns that include product count
export const createSupplierTableColumns = (products: Product[]): TableColumn<Supplier>[] => [
  ...supplierTableColumns,
  {
    key: 'productCount',
    label: 'Products',
    className: 'count-cell',
    render: (supplier: Supplier) => {
      const count = products.filter(product => product.supplierId === supplier.id).length
      return <span className="product-count">{count}</span>
    }
  }
]

// Supplier Form Configuration
export const supplierFormSections: FormSection[] = [
  {
    title: "Supplier Information",
    fields: [
      {
        name: "name",
        label: "Supplier Name",
        type: "text",
        required: true,
        placeholder: "Enter supplier name",
        validation: (value) => {
          if (!value || value.trim().length < 2) {
            return "Supplier name must be at least 2 characters long";
          }
          if (value.trim().length > 100) {
            return "Supplier name must be less than 100 characters";
          }
          return undefined;
        }
      },
      {
        name: "email",
        label: "Email",
        type: "text",
        placeholder: "Enter email address",
        validation: (value) => {
          if (value && value.trim() !== '') {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) {
              return "Please enter a valid email address";
            }
            if (value.trim().length > 100) {
              return "Email must be less than 100 characters";
            }
          }
          return undefined;
        }
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        placeholder: "Enter phone number",
        validation: (value) => {
          if (value && value.trim() !== '') {
            // Remove all non-digit characters for validation
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length < 10) {
              return "Phone number must have at least 10 digits";
            }
            if (digitsOnly.length > 15) {
              return "Phone number cannot exceed 15 digits";
            }
            // Check for valid phone format (allow digits, spaces, hyphens, parentheses, plus)
            if (!/^[\d\s\-\(\)\+]+$/.test(value.trim())) {
              return "Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign";
            }
          }
          return undefined;
        }
      }
    ]
  },
  {
    title: "Address",
    fields: [
      {
        name: "address",
        label: "Address",
        type: "textarea",
        placeholder: "Enter supplier address",
        rows: 3,
        validation: (value) => {
          if (value && value.trim().length > 300) {
            return "Address must be less than 300 characters";
          }
          return undefined;
        }
      }
    ]
  }
]

// Stock Movement Table Configuration
export const stockMovementTableColumns: TableColumn<StockMovement>[] = [
  {
    key: 'date',
    label: 'Date',
    className: 'date-cell',    render: (movement: StockMovement) => {
      let date: Date;
      if (movement.date?.toDate) {
        // Firestore Timestamp
        date = movement.date.toDate();
      } else if (movement.date instanceof Date) {
        date = movement.date;
      } else {
        // Fallback for other date formats
        date = new Date();
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
  {
    key: 'type',
    label: 'Type',
    className: 'type-cell',
    render: (movement: StockMovement) => (
      <span className={`movement-type ${movement.type === 'in' ? 'stock-in' : 'stock-out'}`}>
        {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
      </span>
    )
  },
  {
    key: 'quantity',
    label: 'Quantity',
    className: 'quantity-cell',
    render: (movement: StockMovement) => (
      <span className={movement.type === 'in' ? 'positive-qty' : 'negative-qty'}>
        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
      </span>
    )
  },
  {
    key: 'reason',
    label: 'Reason',
    className: 'reason-cell',
    render: (movement: StockMovement) => {
      const reasonLabels = {
        purchase: 'Purchase',
        sale: 'Sale',
        adjustment: 'Adjustment',
        damage: 'Damage',
        return: 'Return',
        transfer: 'Transfer'
      };
      return reasonLabels[movement.reason] || movement.reason;
    }
  },
  {
    key: 'reference',
    label: 'Reference',
    className: 'reference-cell',
    render: (movement: StockMovement) => movement.reference || '-'
  },
  {
    key: 'previousStock',
    label: 'Previous Stock',
    className: 'stock-cell'
  },
  {
    key: 'newStock',
    label: 'New Stock',
    className: 'stock-cell'
  },
  {
    key: 'notes',
    label: 'Notes',
    className: 'notes-cell',
    render: (movement: StockMovement) => movement.notes || '-'
  }
]

// Stock Movement Form Configuration
export const stockMovementFormSections: FormSection[] = [
  {
    title: "Movement Information",
    fields: [
      {
        name: "type",
        label: "Movement Type",
        type: "select",
        required: true,
        options: [
          { value: "in", label: "Stock In" },
          { value: "out", label: "Stock Out" }
        ],
        validation: (value) => {
          if (!value || (value !== "in" && value !== "out")) {
            return "Please select a valid movement type";
          }
          return undefined;
        }
      },
      {
        name: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        placeholder: "0",
        min: "1",
        validation: (value) => {
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue <= 0) {
            return "Quantity must be greater than 0";
          }
          if (numValue > 999999) {
            return "Quantity cannot exceed 999,999";
          }
          // Check if it's a whole number
          if (!Number.isInteger(parseFloat(value))) {
            return "Quantity must be a whole number";
          }
          return undefined;
        }
      },
      {
        name: "reason",
        label: "Reason",
        type: "select",
        required: true,
        options: [
          { value: "purchase", label: "Purchase" },
          { value: "sale", label: "Sale" },
          { value: "adjustment", label: "Adjustment" },
          { value: "damage", label: "Damage" },
          { value: "return", label: "Return" },
          { value: "transfer", label: "Transfer" }
        ],
        validation: (value) => {
          const validReasons = ["purchase", "sale", "adjustment", "damage", "return", "transfer"];
          if (!value || !validReasons.includes(value)) {
            return "Please select a valid reason";
          }
          return undefined;
        }
      },
      {
        name: "reference",
        label: "Reference Number",
        type: "text",
        placeholder: "PO#, Invoice#, etc.",
        validation: (value) => {
          if (value && value.trim().length > 50) {
            return "Reference number must be less than 50 characters";
          }
          // Allow alphanumeric, hyphens, underscores, hash, and spaces
          if (value && !/^[A-Za-z0-9\s\-_#]+$/.test(value.trim())) {
            return "Reference can only contain letters, numbers, spaces, hyphens, underscores, and hash symbols";
          }
          return undefined;
        }
      }
    ]
  },
  {
    title: "Additional Details",
    fields: [
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        placeholder: "Additional notes about this movement",
        rows: 3,
        validation: (value) => {
          if (value && value.trim().length > 500) {
            return "Notes must be less than 500 characters";
          }
          return undefined;
        }
      }
    ]
  }
]
