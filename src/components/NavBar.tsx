import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import InventoryHamburgerMenu from './InventoryHamburgerMenu'

const NavBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentInventorySection, setCurrentInventorySection] = useState('products')

  const handleLogout = () => {
    // Add logout logic here (clear tokens, etc.)
    console.log('Logging out...')
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleInventorySectionChange = (section: string) => {
    setCurrentInventorySection(section)
    // You can add logic here to communicate with the Inventory page
    // For now, we'll use a custom event
    window.dispatchEvent(new CustomEvent('inventorySectionChange', { 
      detail: { section } 
    }))
  }
  const isActiveLink = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/')
  }

  const isInventoryPage = location.pathname === '/inventory'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Inventory Hamburger Menu - Only show on inventory page */}
        {isInventoryPage && (
          <InventoryHamburgerMenu onSectionChange={handleInventorySectionChange} />
        )}
        
        {/* Logo/Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <h2>Rhuden Construction</h2>
        </Link>        {/* Desktop Navigation Links */}
        <div className="navbar-menu">
          <Link 
            to="/dashboard" 
            className={`navbar-link ${isActiveLink('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/inventory" 
            className={`navbar-link ${isActiveLink('/inventory') ? 'active' : ''}`}
          >
            Inventory
          </Link>
          <Link 
            to="/pos" 
            className={`navbar-link ${isActiveLink('/pos') ? 'active' : ''}`}
          >
            POS
          </Link>
          <Link 
            to="/transactions" 
            className={`navbar-link ${isActiveLink('/transactions') ? 'active' : ''}`}
          >
            Transactions
          </Link>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/dashboard" 
          className={`mobile-link ${isActiveLink('/dashboard') ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Dashboard
        </Link>
        <Link 
          to="/inventory" 
          className={`mobile-link ${isActiveLink('/inventory') ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Inventory
        </Link>
        <Link 
          to="/pos" 
          className={`mobile-link ${isActiveLink('/pos') ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          POS
        </Link>
        <Link 
          to="/transactions" 
          className={`mobile-link ${isActiveLink('/transactions') ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Transactions
        </Link>
        <button 
          onClick={() => {
            handleLogout()
            setIsMobileMenuOpen(false)
          }} 
          className="mobile-logout-button"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default NavBar