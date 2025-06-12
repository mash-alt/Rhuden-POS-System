import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface InventoryHamburgerMenuProps {
  onSectionChange?: (section: string) => void;
}

const InventoryHamburgerMenu: React.FC<InventoryHamburgerMenuProps> = ({ onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleSectionClick = (section: string) => {
    setIsOpen(false)
    if (onSectionChange) {
      onSectionChange(section)
    }
  }

  const menuItems = [
    {
      id: 'products',
      label: 'Products',
      icon: '📦',
      description: 'Manage product catalog'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: '🏷️',
      description: 'Organize product categories'
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: '🏢',
      description: 'Manage supplier information'
    },
    {
      id: 'stock-history',
      label: 'Stock History',
      icon: '📊',
      description: 'View stock movements'
    }
  ]

  return (
    <div className="inventory-hamburger">
      {/* Hamburger Button */}
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle inventory menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="hamburger-overlay" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Menu Panel */}
      <div className={`hamburger-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>Inventory Management</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <div className="menu-content">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className="menu-item"
              onClick={() => handleSectionClick(item.id)}
            >
              <div className="menu-item-icon">{item.icon}</div>
              <div className="menu-item-content">
                <span className="menu-item-label">{item.label}</span>
                <span className="menu-item-description">{item.description}</span>
              </div>
              <div className="menu-item-arrow">›</div>
            </button>
          ))}
        </div>

        <div className="menu-footer">
          <p>Select a section to manage inventory</p>
        </div>
      </div>
    </div>
  )
}

export default InventoryHamburgerMenu