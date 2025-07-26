import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Timestamp, doc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Table from "../components/Table";
import Form from "../components/Form";
import { useAuth } from "../contexts/AuthContext";
import useProducts from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useSuppliers } from "../hooks/useSuppliers";
import { useStockMovements } from "../hooks/useStockMovements";
import useCustomers from "../hooks/useCustomers";
import { downloadCSV } from "../utils/exportCsv";
import type { Product, Category, Supplier, StockMovement, Customer } from "../types";
import {
  productTableColumns,
  createCategoryTableColumns,
  createSupplierTableColumns,
  stockMovementTableColumns,
  customerTableColumns,
  productFormSections,
  categoryFormSections,
  supplierFormSections,
  stockMovementFormSections,
  customerFormSections,
} from "../config/tableConfig.tsx";
import "../styles/inventory.css";

const Inventory = () => {
  const navigate = useNavigate();
  const { isAdmin, currentUser } = useAuth();
  const {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getLowStockProducts,
  } = useProducts();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();
  const {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers,
  } = useSuppliers();
  const {
    loading: stockMovementsLoading,
    error: stockMovementsError,
    addStockMovement,
    searchStockMovements,
  } = useStockMovements();
  // Transaction History hooks
  const { customers, loading: customersLoading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [stockMovementSearchTerm, setStockMovementSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [currentSection, setCurrentSection] = useState("products");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);  const [showStockMovementForm, setShowStockMovementForm] = useState(false);
  const [editingStockMovement, setEditingStockMovement] =
    useState<StockMovement | null>(null);

  // Form validation state
  const [, setFormErrors] = useState<{[key: string]: string}>({});

  // Use the enhanced search functionality
  const filteredProducts = searchProducts(searchTerm);
  const lowStockProducts = getLowStockProducts();

  // Category search functionality
  const searchCategories = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const term = searchTerm.toLowerCase().trim();

    return categories.filter((category) => {
      // Search in name
      if (category.name.toLowerCase().includes(term)) return true;

      // Search in description
      if (
        category.description &&
        category.description.toLowerCase().includes(term)
      )
        return true;

      return false;
    });
  };
  const filteredCategories = searchCategories(categorySearchTerm);
  const filteredSuppliers = searchSuppliers(supplierSearchTerm);
  const filteredStockMovements = searchStockMovements(stockMovementSearchTerm);

  // Customer search functionality
  const searchCustomers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return customers;
    }

    const term = searchTerm.toLowerCase().trim();

    return customers.filter((customer) => {
      // Search in name
      if (customer.name.toLowerCase().includes(term)) return true;

      // Search in contact
      if (customer.contact && customer.contact.toLowerCase().includes(term)) return true;

      // Search in address
      if (customer.address && customer.address.toLowerCase().includes(term)) return true;

      return false;
    });
  };
  const filteredCustomers = searchCustomers(customerSearchTerm);

  // Helper functions for form configurations
  const getProductFormSections = () => {
    const sections = [...productFormSections];
    // Update category and supplier options
    const categorySection = sections.find((s) => s.title === "Classification");
    if (categorySection) {
      const categoryField = categorySection.fields.find(
        (f) => f.name === "categoryId"
      );
      const supplierField = categorySection.fields.find(
        (f) => f.name === "supplierId"
      );

      if (categoryField) {
        categoryField.options = categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }));
      }

      if (supplierField) {
        supplierField.options = suppliers.map((sup) => ({
          value: sup.id,
          label: sup.name,
        }));
      }
    }
    return sections;
  };

  const getProductRowClassName = (product: Product) => {
    const isLowStock =
      product.stockQuantity !== undefined &&
      product.reorderLevel !== undefined &&
      product.stockQuantity <= product.reorderLevel;
    return isLowStock ? "low-stock-row" : "";
  };
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(productId);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };
  const handleProductFormSubmit = async (productData: Omit<Product, "id">) => {
    try {
      // Validate required fields
      const errors: {[key: string]: string} = {};
      if (!productData.name?.trim()) {
        errors.name = "Product name is required";
      }
      if (!productData.sku?.trim()) {
        errors.sku = "SKU is required";
      }
      if (productData.price === undefined || productData.price < 0) {
        errors.price = "Valid price is required";
      }
      if (productData.cost === undefined || productData.cost < 0) {
        errors.cost = "Valid cost is required";
      }
      if (!productData.unit?.trim()) {
        errors.unit = "Unit of measurement is required";
      }
      
      // If not active, show a warning but don't block submission
      if (productData.active === false) {
        const confirmInactive = window.confirm(
          "Warning: This product is marked as INACTIVE and won't appear in sales. Are you sure you want to continue?"
        );
        if (!confirmInactive) {
          return; // Cancel submission if user doesn't confirm
        }
      }

      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        alert("Please correct the following errors:\n" + Object.values(errors).join("\n"));
        return;
      }
      
      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, productData);
      } else {
        // Add new product - now returns the new product ID
        const newProductId = await addProduct(productData);
        
        // Create a stock movement record for the new product
        if (newProductId && productData.stockQuantity && productData.stockQuantity > 0) {
          try {
            // Add the stock movement directly to Firestore
            await addDoc(collection(db, 'stockMovements'), {
              productId: doc(db, 'products', newProductId),
              type: "in",
              quantity: productData.stockQuantity,
              reason: "adjustment", 
              reference: `Initial inventory`,
              notes: `Initial stock for new product ${productData.name} (${productData.sku})`,
              date: Timestamp.now(),
              userId: doc(db, 'users', currentUser?.uid || 'system'),
              previousStock: 0,
              newStock: productData.stockQuantity
            });
            
            console.log('Stock movement created for new product with ID:', newProductId);
          } catch (error) {
            console.error('Error creating stock movement for new product:', error);
          }
        }
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  };

  const handleProductFormCancel = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Category handlers
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategory(categoryId);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleCategoryFormSubmit = async (
    categoryData: Omit<Category, "id">
  ) => {
    try {
      // Validate required fields
      const errors: {[key: string]: string} = {};
      if (!categoryData.name?.trim()) {
        errors.name = "Category name is required";
      }
      
      // If not active, show a warning but don't block submission
      if (categoryData.active === false) {
        const confirmInactive = window.confirm(
          "Warning: This category is marked as INACTIVE and products in this category won't appear in sales. Are you sure you want to continue?"
        );
        if (!confirmInactive) {
          return; // Cancel submission if user doesn't confirm
        }
      }

      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        alert("Please correct the following errors:\n" + Object.values(errors).join("\n"));
        return;
      }
      
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, categoryData);
      } else {
        // Add new category
        await addCategory(categoryData);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving category:", error);
      throw error;
    }
  };
  const handleCategoryFormCancel = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  // Supplier handlers
  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplier(supplierId);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowSupplierForm(true);
  };

  const handleSupplierFormSubmit = async (
    supplierData: Omit<Supplier, "id">
  ) => {
    try {
      // Validate required fields
      const errors: {[key: string]: string} = {};
      if (!supplierData.name?.trim()) {
        errors.name = "Supplier name is required";
      }
      
      // If not active, show a warning but don't block submission
      if (supplierData.active === false) {
        const confirmInactive = window.confirm(
          "Warning: This supplier is marked as INACTIVE and may not appear in some lists. Are you sure you want to continue?"
        );
        if (!confirmInactive) {
          return; // Cancel submission if user doesn't confirm
        }
      }

      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        alert("Please correct the following errors:\n" + Object.values(errors).join("\n"));
        return;
      }
      
      if (editingSupplier) {
        // Update existing supplier
        await updateSupplier(editingSupplier.id, supplierData);
      } else {
        // Add new supplier
        await addSupplier(supplierData);
      }
      setShowSupplierForm(false);
      setEditingSupplier(null);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving supplier:", error);
      throw error;
    }
  };
  const handleSupplierFormCancel = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  // Customer handlers
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      // Check if customer has outstanding credit (credit management is handled in POS module)
      const customerToDelete = customers.find(c => c.id === customerId);
      if (customerToDelete && (customerToDelete.creditBalance || 0) > 0) {
        alert("Cannot delete customer with outstanding credit balance! Please clear the balance in the POS module first.");
        return;
      }
      deleteCustomer(customerId);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleCustomerFormSubmit = async (customerData: Omit<Customer, "id">) => {
    try {
      // Validate required fields
      const errors: {[key: string]: string} = {};
      if (!customerData.name?.trim()) {
        errors.name = "Customer name is required";
      }
      
      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        alert("Please correct the following errors:\n" + Object.values(errors).join("\n"));
        return;
      }
      
      if (editingCustomer) {
        // Update existing customer - only allow updating name, contact, and address
        const updateData = {
          name: customerData.name,
          contact: customerData.contact,
          address: customerData.address,
        };
        await updateCustomer(editingCustomer.id, updateData);
      } else {
        // Add new customer with default credit values (needed for compatibility with POS module)
        const newCustomerData = {
          ...customerData,
          creditBalance: 0,
          creditAgreements: [],
          joinDate: Timestamp.now(),
        };
        await addCustomer(newCustomerData);
      }
      setShowCustomerForm(false);
      setEditingCustomer(null);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving customer:", error);
      throw error;
    }
  };

  const handleCustomerFormCancel = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  // Stock Movement handlers
  const handleAddStockMovement = () => {
    setEditingStockMovement(null);
    setShowStockMovementForm(true);
  };

  const handleStockMovementFormSubmit = async (
    stockMovementData: Omit<StockMovement, "id">
  ) => {
    try {
      // Validate required fields
      const errors: {[key: string]: string} = {};
      if (!stockMovementData.productId) {
        errors.productId = "Product selection is required";
      }
      if (!stockMovementData.type?.trim()) {
        errors.type = "Movement type is required";
      }
      if (stockMovementData.quantity === undefined || stockMovementData.quantity === 0) {
        errors.quantity = "Quantity cannot be zero";
      }
      
      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        alert("Please correct the following errors:\n" + Object.values(errors).join("\n"));
        return;
      }
      
      // Note: In a real application, you would need to handle product selection
      // and calculate previous/new stock levels properly
      await addStockMovement(stockMovementData);
      setShowStockMovementForm(false);
      setEditingStockMovement(null);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving stock movement:", error);
      throw error;
    }
  };
  const handleStockMovementFormCancel = () => {
    setShowStockMovementForm(false);
    setEditingStockMovement(null);
  };  // No Credit Payment handlers since they've been moved to POS

  // const handleSectionChange = (section: string) => {
  //   setCurrentSection(section);
  //   console.log("Changed to section:", section);
  // };
  // Listen for inventory section changes from navbar
  useEffect(() => {
    const handleInventorySectionChange = (event: CustomEvent) => {
      const section = event.detail.section;
        if (section === "transaction-history") {
        // Navigate to the TransactionHistory page
        navigate("/transactions");
      } else {
        // Set the section for other sections
        setCurrentSection(section);
      }
    };

    window.addEventListener(
      "inventorySectionChange",
      handleInventorySectionChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "inventorySectionChange",
        handleInventorySectionChange as EventListener
      );
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-message">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <h3>Error Loading Inventory</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-container">
      {" "}
      {/* Product Form Modal */}
      {showProductForm && (
        <Form<Product>
          title="Product"
          sections={getProductFormSections()}
          onSubmit={handleProductFormSubmit}
          onCancel={handleProductFormCancel}
          initialData={editingProduct || undefined}
          isEdit={!!editingProduct}
        />
      )}
      {/* Category Form Modal */}
      {showCategoryForm && (
        <Form<Category>
          title="Category"
          sections={categoryFormSections}
          onSubmit={handleCategoryFormSubmit}
          onCancel={handleCategoryFormCancel}
          initialData={editingCategory || undefined}
          isEdit={!!editingCategory}
        />
      )}{" "}
      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <Form<Supplier>
          title="Supplier"
          sections={supplierFormSections}
          onSubmit={handleSupplierFormSubmit}
          onCancel={handleSupplierFormCancel}
          initialData={editingSupplier || undefined}
          isEdit={!!editingSupplier}
        />
      )}
      {/* Stock Movement Form Modal */}
      {showStockMovementForm && (
        <Form<StockMovement>
          title="Stock Movement"
          sections={stockMovementFormSections}
          onSubmit={handleStockMovementFormSubmit}
          onCancel={handleStockMovementFormCancel}
          initialData={editingStockMovement || undefined}
          isEdit={!!editingStockMovement}
        />
      )}
      {/* Customer Form Modal */}
      {showCustomerForm && (
        <Form<Customer>
          title="Customer"
          sections={customerFormSections}
          onSubmit={handleCustomerFormSubmit}
          onCancel={handleCustomerFormCancel}
          initialData={editingCustomer || undefined}
          isEdit={!!editingCustomer}
        />
      )}
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Manage your construction materials and equipment</p>
      </div>
      <div className="page-content">
        {" "}
        {/* Render different sections based on current selection */}
        {currentSection === "products" && (
          <>
            {" "}
            {/* Inventory Controls */}
            <div className="inventory-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search products by name, SKU, description, or unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />              
              </div>
              <div className="button-group">
                <button 
                  onClick={() => downloadCSV(filteredProducts, 'products.csv', ['createdAt'])} 
                  className="export-button"
                  title="Export to CSV"
                >
                  Export CSV
                </button>
                {isAdmin && (
                  <button onClick={handleAddProduct} className="add-button">
                    Add Product
                  </button>
                )}
              </div>
            </div>
            {/* Show search results count */}
            {searchTerm && (
              <div className="search-results-info">
                Found {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} matching "
                {searchTerm}"
              </div>
            )}
            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && !searchTerm && (
              <div className="low-stock-alert">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <strong>
                    {lowStockProducts.length} item
                    {lowStockProducts.length !== 1 ? "s" : ""} running low on
                    stock!
                  </strong>
                  <div className="low-stock-items">
                    {lowStockProducts.slice(0, 3).map((product) => (
                      <span key={product.id} className="low-stock-item">
                        {product.name} ({product.stockQuantity} {product.unit})
                      </span>
                    ))}
                    {lowStockProducts.length > 3 && (
                      <span className="more-items">
                        +{lowStockProducts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Products Table */}
            <div className="content-section">
              <div className="section-header">
                <h2>Products ({filteredProducts.length})</h2>
                <p>Manage your inventory items</p>
              </div>{" "}              <Table<Product>
                data={filteredProducts}
                columns={productTableColumns}
                onEdit={isAdmin ? handleEdit : undefined}
                onDelete={isAdmin ? handleDelete : undefined}
                showActions={isAdmin}
                emptyMessage="No products found"
                getRowClassName={getProductRowClassName}
                getItemId={(product) => product.id}
              />
            </div>
          </>
        )}{" "}
        {currentSection === "categories" && (
          <div className="content-section">
            <div className="section-header">
              <h2>Categories</h2>
              <p>Organize your product categories</p>
            </div>

            {/* Category Controls */}
            <div className="inventory-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search categories by name or description..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="search-input"
                />              
              </div>
              <div className="button-group">
                <button 
                  onClick={() => downloadCSV(filteredCategories, 'categories.csv')} 
                  className="export-button"
                  title="Export to CSV"
                >
                  Export CSV
                </button>
                {isAdmin && (
                  <button onClick={handleAddCategory} className="add-button">
                    Add Category
                  </button>
                )}
              </div>
            </div>

            {/* Show search results count */}
            {categorySearchTerm && (
              <div className="search-results-info">
                Found {filteredCategories.length} categor
                {filteredCategories.length !== 1 ? "ies" : "y"} matching "
                {categorySearchTerm}"
              </div>
            )}

            {/* Categories Table */}
            <div className="content-section">
              {" "}
              <div className="section-header">
                <h2>Categories ({filteredCategories.length})</h2>
                <p>Manage your product categories</p>
              </div>
              {categoriesLoading ? (
                <div className="loading-message">Loading categories...</div>
              ) : categoriesError ? (
                <div className="error-message">
                  <p>{categoriesError}</p>
                  <button onClick={() => window.location.reload()}>
                    Retry
                  </button>
                </div>
              ) : (                <Table<Category>
                  data={filteredCategories}
                  columns={createCategoryTableColumns(products)}
                  onEdit={isAdmin ? handleEditCategory : undefined}
                  onDelete={isAdmin ? handleDeleteCategory : undefined}
                  showActions={isAdmin}
                  emptyMessage="No categories found"
                  getItemId={(category) => category.id}
                />
              )}
            </div>
          </div>
        )}{" "}
        {currentSection === "suppliers" && (
          <div className="content-section">
            <div className="section-header">
              <h2>Suppliers</h2>
              <p>Manage supplier information</p>
            </div>

            {/* Supplier Controls */}
            <div className="inventory-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search suppliers by name, email, phone, or address..."
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  className="search-input"
                />              
              </div>
              <div className="button-group">
                <button 
                  onClick={() => downloadCSV(filteredSuppliers, 'suppliers.csv')} 
                  className="export-button"
                  title="Export to CSV"
                >
                  Export CSV
                </button>
                {isAdmin && (
                  <button onClick={handleAddSupplier} className="add-button">
                    Add Supplier
                  </button>
                )}
              </div>
            </div>

            {/* Show search results count */}
            {supplierSearchTerm && (
              <div className="search-results-info">
                Found {filteredSuppliers.length} supplier
                {filteredSuppliers.length !== 1 ? "s" : ""} matching "
                {supplierSearchTerm}"
              </div>
            )}

            {/* Suppliers Table */}
            <div className="content-section">
              <div className="section-header">
                <h2>Suppliers ({filteredSuppliers.length})</h2>
                <p>Manage your supplier information</p>
              </div>

              {suppliersLoading ? (
                <div className="loading-message">Loading suppliers...</div>
              ) : suppliersError ? (
                <div className="error-message">
                  <p>{suppliersError}</p>
                  <button onClick={() => window.location.reload()}>
                    Retry
                  </button>
                </div>
              ) : (                <Table<Supplier>
                  data={filteredSuppliers}
                  columns={createSupplierTableColumns(products)}
                  onEdit={isAdmin ? handleEditSupplier : undefined}
                  onDelete={isAdmin ? handleDeleteSupplier : undefined}
                  showActions={isAdmin}
                  emptyMessage="No suppliers found"
                  getItemId={(supplier) => supplier.id}
                />
              )}
            </div>
          </div>
        )}{" "}
        {currentSection === "stock-history" && (
          <div className="content-section">
            <div className="section-header">
              <h2>Stock History</h2>
              <p>Track stock movements and history</p>
            </div>

            {/* Stock Movement Controls */}
            <div className="inventory-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search movements by reason, reference, notes, or type..."
                  value={stockMovementSearchTerm}
                  onChange={(e) => setStockMovementSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="button-group">
                <button 
                  onClick={() => downloadCSV(filteredStockMovements, 'stock-movements.csv', ['userId', 'productId'])} 
                  className="export-button"
                  title="Export to CSV"
                >
                  Export CSV
                </button>
                <button onClick={handleAddStockMovement} className="add-button">
                  Add Movement
                </button>
              </div>
            </div>

            {/* Show search results count */}
            {stockMovementSearchTerm && (
              <div className="search-results-info">
                Found {filteredStockMovements.length} movement
                {filteredStockMovements.length !== 1 ? "s" : ""} matching "
                {stockMovementSearchTerm}"
              </div>
            )}

            {/* Stock Movements Table */}
            <div className="content-section">
              <div className="section-header">
                <h2>Stock Movements ({filteredStockMovements.length})</h2>
                <p>View all stock movement history</p>
              </div>

              {stockMovementsLoading ? (
                <div className="loading-message">
                  Loading stock movements...
                </div>
              ) : stockMovementsError ? (
                <div className="error-message">
                  <p>{stockMovementsError}</p>
                  <button onClick={() => window.location.reload()}>
                    Retry
                  </button>
                </div>
              ) : (                <Table<StockMovement>
                  data={filteredStockMovements}
                  columns={stockMovementTableColumns}
                  onEdit={() => {}} // Stock movements are typically not edited
                  onDelete={() => {}} // Stock movements are typically not deleted
                  showActions={false} // No edit/delete actions for stock movements
                  emptyMessage="No stock movements found"
                  getItemId={(movement) => movement.id}
                />
              )}
            </div>
          </div>        )}

        {/* Customers Section */}
        {currentSection === "customers" && (
          <div className="content-section">
            <div className="section-header">
              <h2>Customers</h2>
              <p>Manage customer information</p>
            </div>

            {/* Customer Controls */}
            <div className="inventory-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search customers by name, contact, or address..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="button-group">
                <button 
                  onClick={() => downloadCSV(filteredCustomers, 'customers.csv', ['joinDate', 'lastPaymentDate'])} 
                  className="export-button"
                  title="Export to CSV"
                >
                  Export CSV
                </button>
                {isAdmin && (
                  <button onClick={handleAddCustomer} className="add-button">
                    Add Customer
                  </button>
                )}
              </div>
            </div>

            {/* Show search results count */}
            {customerSearchTerm && (
              <div className="search-results-info">
                Found {filteredCustomers.length} customer
                {filteredCustomers.length !== 1 ? "s" : ""} matching "
                {customerSearchTerm}"
              </div>
            )}

            {/* Customers Table */}
            <div className="content-section">
              <div className="section-header">
                <h2>Customers ({filteredCustomers.length})</h2>
                <p>Manage your customer information</p>
              </div>

              {customersLoading ? (
                <div className="loading-message">Loading customers...</div>
              ) : (
                <Table<Customer>
                  data={filteredCustomers}
                  columns={customerTableColumns}
                  onEdit={isAdmin ? handleEditCustomer : undefined}
                  onDelete={isAdmin ? handleDeleteCustomer : undefined}
                  showActions={isAdmin}
                  emptyMessage="No customers found"
                  getItemId={(customer) => customer.id}
                />
              )}
            </div>
          </div>
        )}

        {/* Credit Payments section removed - now handled in the POS module */}
      </div>
    </div>
  );
};

export default Inventory;
