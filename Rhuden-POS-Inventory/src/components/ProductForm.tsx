import React, { useState } from "react";
import type { Product } from "../types";
import { useCategories } from "../hooks/useCategories";
import { useSuppliers } from "../hooks/useSuppliers";

interface ProductFormProps {
  onSubmit: (product: Omit<Product, "id">) => Promise<void>;
  onCancel: () => void;
  initialData?: Product;
  isEdit?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
}) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const { suppliers, loading: suppliersLoading } = useSuppliers();  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    price: initialData?.price || 0,
    cost: initialData?.cost || 0,
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "", // Store as string ID for form state
    supplierId: initialData?.supplierId || "", // Store as string ID for form state
    stockQuantity: initialData?.stockQuantity || 0,
    reorderLevel: initialData?.reorderLevel || 0,
    unit: initialData?.unit || "piece",
    active: initialData?.active !== false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
    }

    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (!formData.supplierId) {
      newErrors.supplierId = "Supplier is required";
    }

    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity cannot be negative";
    }

    if (formData.reorderLevel < 0) {
      newErrors.reorderLevel = "Reorder level cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);    try {
      const selectedCategory = categories.find(
        (cat) => cat.id === formData.categoryId
      );
      const selectedSupplier = suppliers.find(
        (sup) => sup.id === formData.supplierId
      );

      if (!selectedCategory || !selectedSupplier) {
        throw new Error("Invalid category or supplier selection");
      }

      await onSubmit({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: formData.price,
        cost: formData.cost,
        description: formData.description.trim(),
        categoryId: selectedCategory.id, // Pass the ID string, not the ref
        supplierId: selectedSupplier.id, // Pass the ID string, not the ref
        stockQuantity: formData.stockQuantity,
        reorderLevel: formData.reorderLevel,
        unit: formData.unit,
        active: formData.active,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesLoading || suppliersLoading) {
    return (
      <div className="form-loading">
        <div className="loading-spinner"></div>
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="form-header">
          <h2>{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? "error" : ""}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="sku">SKU *</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={errors.sku ? "error" : ""}
                  placeholder="Enter SKU"
                />
                {errors.sku && (
                  <span className="error-message">{errors.sku}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="form-section">
              <h3>Pricing</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Selling Price *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={errors.price ? "error" : ""}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && (
                    <span className="error-message">{errors.price}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="cost">Cost Price</label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Categories & Suppliers */}
            <div className="form-section">
              <h3>Classification</h3>

              <div className="form-group">
                <label htmlFor="categoryId">Category *</label>{" "}
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className={errors.categoryId ? "error" : ""}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <span className="error-message">{errors.categoryId}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="supplierId">Supplier *</label>{" "}
                <select
                  id="supplierId"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplierId: e.target.value,
                    }))
                  }
                  className={errors.supplierId ? "error" : ""}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <span className="error-message">{errors.supplierId}</span>
                )}
              </div>
            </div>

            {/* Inventory */}
            <div className="form-section">
              <h3>Inventory</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stockQuantity">Stock Quantity</label>
                  <input
                    type="number"
                    id="stockQuantity"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    className={errors.stockQuantity ? "error" : ""}
                    placeholder="0"
                    min="0"
                  />
                  {errors.stockQuantity && (
                    <span className="error-message">
                      {errors.stockQuantity}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="reorderLevel">Reorder Level</label>
                  <input
                    type="number"
                    id="reorderLevel"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    className={errors.reorderLevel ? "error" : ""}
                    placeholder="0"
                    min="0"
                  />
                  {errors.reorderLevel && (
                    <span className="error-message">{errors.reorderLevel}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                >
                  <option value="piece">Piece</option>
                  <option value="box">Box</option>
                  <option value="bag">Bag</option>
                  <option value="roll">Roll</option>
                  <option value="sheet">Sheet</option>
                  <option value="rental">Rental</option>
                  <option value="meter">Meter</option>
                  <option value="kilogram">Kilogram</option>
                  <option value="liter">Liter</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleCheckboxChange}
                  />
                  <span>Active Product</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
