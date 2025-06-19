import { useState, useEffect } from "react";
import Table from "../components/Table";
import Form from "../components/Form";
import useProducts from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useSuppliers } from "../hooks/useSuppliers";
import { useStockMovements } from "../hooks/useStockMovements";
import type { Product, Category, Supplier, StockMovement } from "../types";
import {
  productTableColumns,
  createCategoryTableColumns,
  createSupplierTableColumns,
  stockMovementTableColumns,
  productFormSections,
  categoryFormSections,
  supplierFormSections,
  stockMovementFormSections
} from "../config/tableConfig.tsx";

const Inventory = () => {
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
    deleteCategory
  } = useCategories();
    const { 
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers
  } = useSuppliers();
  
  const {
    loading: stockMovementsLoading,
    error: stockMovementsError,
    addStockMovement,
    searchStockMovements
  } = useStockMovements();
    const [searchTerm, setSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [stockMovementSearchTerm, setStockMovementSearchTerm] = useState("");
  const [currentSection, setCurrentSection] = useState("products");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showStockMovementForm, setShowStockMovementForm] = useState(false);
  const [editingStockMovement, setEditingStockMovement] = useState<StockMovement | null>(null);// Use the enhanced search functionality
  const filteredProducts = searchProducts(searchTerm);
  const lowStockProducts = getLowStockProducts();

  // Category search functionality
  const searchCategories = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return categories.filter(category => {
      // Search in name
      if (category.name.toLowerCase().includes(term)) return true;
      
      // Search in description
      if (category.description && category.description.toLowerCase().includes(term)) return true;
      
      return false;
    });
  };
  const filteredCategories = searchCategories(categorySearchTerm);
  const filteredSuppliers = searchSuppliers(supplierSearchTerm);
  const filteredStockMovements = searchStockMovements(stockMovementSearchTerm);

  // Helper functions for form configurations
  const getProductFormSections = () => {
    const sections = [...productFormSections];
    // Update category and supplier options
    const categorySection = sections.find(s => s.title === "Classification");
    if (categorySection) {
      const categoryField = categorySection.fields.find(f => f.name === "categoryId");
      const supplierField = categorySection.fields.find(f => f.name === "supplierId");
      
      if (categoryField) {
        categoryField.options = categories.map(cat => ({
          value: cat.id,
          label: cat.name
        }));
      }
      
      if (supplierField) {
        supplierField.options = suppliers.map(sup => ({
          value: sup.id,
          label: sup.name
        }));
      }
    }
    return sections;
  };

  const getProductRowClassName = (product: Product) => {
    const isLowStock = product.stockQuantity !== undefined && 
                      product.reorderLevel !== undefined && 
                      product.stockQuantity <= product.reorderLevel;
    return isLowStock ? 'low-stock-row' : '';
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
  const handleProductFormSubmit = async (productData: Omit<Product, 'id'>) => {
    try {
      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, productData);
      } else {
        // Add new product
        await addProduct(productData);
      }
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
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

  const handleCategoryFormSubmit = async (categoryData: Omit<Category, 'id'>) => {
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, categoryData);
      } else {
        // Add new category
        await addCategory(categoryData);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
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

  const handleSupplierFormSubmit = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      if (editingSupplier) {
        // Update existing supplier
        await updateSupplier(editingSupplier.id, supplierData);
      } else {
        // Add new supplier
        await addSupplier(supplierData);
      }
      setShowSupplierForm(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      throw error;
    }
  };
  const handleSupplierFormCancel = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  // Stock Movement handlers
  const handleAddStockMovement = () => {
    setEditingStockMovement(null);
    setShowStockMovementForm(true);
  };

  const handleStockMovementFormSubmit = async (stockMovementData: Omit<StockMovement, 'id'>) => {
    try {
      // Note: In a real application, you would need to handle product selection
      // and calculate previous/new stock levels properly
      await addStockMovement(stockMovementData);
      setShowStockMovementForm(false);
      setEditingStockMovement(null);
    } catch (error) {
      console.error('Error saving stock movement:', error);
      throw error;
    }
  };

  const handleStockMovementFormCancel = () => {
    setShowStockMovementForm(false);
    setEditingStockMovement(null);
  };

  // const handleSectionChange = (section: string) => {
  //   setCurrentSection(section);
  //   console.log("Changed to section:", section);
  // };

  // Listen for inventory section changes from navbar
  useEffect(() => {
    const handleInventorySectionChange = (event: CustomEvent) => {
      setCurrentSection(event.detail.section);
    };

    window.addEventListener('inventorySectionChange', handleInventorySectionChange as EventListener);
    
    return () => {
      window.removeEventListener('inventorySectionChange', handleInventorySectionChange as EventListener);
    };  }, []);

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
    <div className="page-container">      {/* Product Form Modal */}
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
      )}      {/* Supplier Form Modal */}
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
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Manage your construction materials and equipment</p>
      </div>
      <div className="page-content">        {/* Render different sections based on current selection */}
        {currentSection === "products" && (
          <>            {/* Inventory Controls */}
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
              <button onClick={handleAddProduct} className="add-button">
                Add Product
              </button>
            </div>

            {/* Show search results count */}
            {searchTerm && (
              <div className="search-results-info">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && !searchTerm && (
              <div className="low-stock-alert">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <strong>{lowStockProducts.length} item{lowStockProducts.length !== 1 ? 's' : ''} running low on stock!</strong>
                  <div className="low-stock-items">
                    {lowStockProducts.slice(0, 3).map(product => (
                      <span key={product.id} className="low-stock-item">
                        {product.name} ({product.stockQuantity} {product.unit})
                      </span>
                    ))}
                    {lowStockProducts.length > 3 && (
                      <span className="more-items">+{lowStockProducts.length - 3} more</span>
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
              </div>              <Table<Product>
                data={filteredProducts}
                columns={productTableColumns}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
                emptyMessage="No products found"
                getRowClassName={getProductRowClassName}
                getItemId={(product) => product.id}
              />
            </div>
          </>
        )}        {currentSection === "categories" && (
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
              <button onClick={handleAddCategory} className="add-button">
                Add Category
              </button>
            </div>

            {/* Show search results count */}
            {categorySearchTerm && (
              <div className="search-results-info">
                Found {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'} matching "{categorySearchTerm}"
              </div>
            )}

            {/* Categories Table */}
            <div className="content-section">              <div className="section-header">
                <h2>Categories ({filteredCategories.length})</h2>
                <p>Manage your product categories</p>
              </div>

              {categoriesLoading ? (
                <div className="loading-message">Loading categories...</div>
              ) : categoriesError ? (
                <div className="error-message">
                  <p>{categoriesError}</p>
                  <button onClick={() => window.location.reload()}>Retry</button>
                </div>              ) : (
                <Table<Category>
                  data={filteredCategories}
                  columns={createCategoryTableColumns(products)}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  showActions={true}
                  emptyMessage="No categories found"
                  getItemId={(category) => category.id}
                />
              )}
            </div>
          </div>
        )}        {currentSection === "suppliers" && (
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
              <button onClick={handleAddSupplier} className="add-button">
                Add Supplier
              </button>
            </div>

            {/* Show search results count */}
            {supplierSearchTerm && (
              <div className="search-results-info">
                Found {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} matching "{supplierSearchTerm}"
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
                  <button onClick={() => window.location.reload()}>Retry</button>
                </div>
              ) : (
                <Table<Supplier>
                  data={filteredSuppliers}
                  columns={createSupplierTableColumns(products)}
                  onEdit={handleEditSupplier}
                  onDelete={handleDeleteSupplier}
                  showActions={true}
                  emptyMessage="No suppliers found"
                  getItemId={(supplier) => supplier.id}
                />
              )}
            </div>
          </div>
        )}        {currentSection === "stock-history" && (
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
              <button onClick={handleAddStockMovement} className="add-button">
                Add Movement
              </button>
            </div>

            {/* Show search results count */}
            {stockMovementSearchTerm && (
              <div className="search-results-info">
                Found {filteredStockMovements.length} movement{filteredStockMovements.length !== 1 ? 's' : ''} matching "{stockMovementSearchTerm}"
              </div>
            )}

            {/* Stock Movements Table */}
            <div className="content-section">
              <div className="section-header">
                <h2>Stock Movements ({filteredStockMovements.length})</h2>
                <p>View all stock movement history</p>
              </div>

              {stockMovementsLoading ? (
                <div className="loading-message">Loading stock movements...</div>
              ) : stockMovementsError ? (
                <div className="error-message">
                  <p>{stockMovementsError}</p>
                  <button onClick={() => window.location.reload()}>Retry</button>
                </div>
              ) : (
                <Table<StockMovement>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
