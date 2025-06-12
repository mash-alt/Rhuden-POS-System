import React, { useState } from "react";

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  rows?: number
  step?: string
  min?: string | number
  validation?: (value: any) => string | undefined
}

export interface FormSection {
  title: string
  fields: FormField[]
}

export interface FormProps<T> {
  title: string
  sections: FormSection[]
  initialData?: T
  isEdit?: boolean
  onSubmit: (data: Omit<T, 'id'>) => Promise<void>
  onCancel: () => void
}

function Form<T extends Record<string, any>>({
  title,
  sections,
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
}: FormProps<T>) {
  // Initialize form data from sections and initial data
  const initializeFormData = () => {
    const data: Record<string, any> = {}
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (initialData && field.name in initialData) {
          data[field.name] = initialData[field.name]
        } else if (field.type === 'checkbox') {
          data[field.name] = false
        } else if (field.type === 'number') {
          data[field.name] = 0
        } else {
          data[field.name] = ""
        }
      })
    })
    return data
  }

  const [formData, setFormData] = useState(initializeFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    sections.forEach(section => {
      section.fields.forEach(field => {
        const value = formData[field.name]
        
        // Required field validation
        if (field.required) {
          if (field.type === 'checkbox') {
            // For checkboxes, we might not want to require them to be checked
          } else if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors[field.name] = `${field.label} is required`
          }
        }

        // Custom validation
        if (field.validation && value !== undefined && value !== '') {
          const validationError = field.validation(value)
          if (validationError) {
            newErrors[field.name] = validationError
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Clean up form data - trim strings and remove empty optional fields
      const cleanedData: Record<string, any> = {}
      sections.forEach(section => {
        section.fields.forEach(field => {
          let value = formData[field.name]
          if (field.type === 'text' || field.type === 'textarea') {
            value = typeof value === 'string' ? value.trim() : value
            if (value || field.required) {
              cleanedData[field.name] = value || undefined
            }
          } else {
            cleanedData[field.name] = value
          }
        })
      })

      await onSubmit(cleanedData as Omit<T, 'id'>)
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Failed to save. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name]
    const hasError = !!errors[field.name]

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleInputChange}
            className={hasError ? "error" : ""}
            placeholder={field.placeholder}
            rows={field.rows || 3}
          />
        )

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleInputChange}
            className={hasError ? "error" : ""}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              name={field.name}
              checked={value || false}
              onChange={handleInputChange}
            />
            <span>{field.label}</span>
          </label>
        )

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleInputChange}
            className={hasError ? "error" : ""}
            placeholder={field.placeholder}
            step={field.step}
            min={field.min}
          />
        )
    }
  }

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="form-header">
          <h2>{isEdit ? `Edit ${title}` : `Add New ${title}`}</h2>
          <button className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            {sections.map((section) => (
              <div key={section.title} className="form-section">
                <h3>{section.title}</h3>
                {section.fields.map((field) => (
                  <div key={field.name} className="form-group">
                    {field.type !== 'checkbox' && (
                      <label htmlFor={field.name}>
                        {field.label} {field.required && '*'}
                      </label>
                    )}
                    {renderField(field)}
                    {errors[field.name] && (
                      <span className="error-message">{errors[field.name]}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
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
                ? `Update ${title}`
                : `Add ${title}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Form
