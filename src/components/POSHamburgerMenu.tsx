import React, { useState } from 'react'

interface POSHamburgerMenuProps {
  onSectionChange?: (section: string) => void;
}

const POSHamburgerMenu: React.FC<POSHamburgerMenuProps> = ({ onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(false)

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
      id: 'pos',
      label: 'Point of Sale',
      icon: '🏪',
      description: 'Process new sales transactions'
    },
    {
      id: 'transaction-history',
      label: 'Transaction History',
      icon: '🧾',
      description: 'View sales and payments'
    },
    {
      id: 'credit-payments',
      label: 'Credit Payments',
      icon: '💳',
      description: 'Process credit payments'
    }
  ]

  return (
    <div className="pos-hamburger">
      {/* Hamburger Button */}
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle POS menu"
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
          <h3>POS Management</h3>
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
          <p>Select a section to manage transactions</p>
        </div>
      </div>
    </div>
  )
}

export default POSHamburgerMenu
