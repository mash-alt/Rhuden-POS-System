import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import InventoryHamburgerMenu from './InventoryHamburgerMenu'
import POSHamburgerMenu from './POSHamburgerMenu'
import { useAuth } from '../contexts/AuthContext'

const NavBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, userProfile, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still navigate to login even if logout fails
      navigate('/login')
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }  
  
  const handleInventorySectionChange = (section: string) => {
    // You can add logic here to communicate with the Inventory page
    // For now, we'll use a custom event
    window.dispatchEvent(new CustomEvent('inventorySectionChange', { 
      detail: { section } 
    }))
  }

  const handlePOSSectionChange = (section: string) => {
    // Dispatch event for POS page section changes
    window.dispatchEvent(new CustomEvent('posSectionChange', { 
      detail: { section } 
    }))
  }

  const isActiveLink = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/')
  }

  const isInventoryPage = location.pathname === '/inventory'
  const isPOSPage = location.pathname === '/pos'

  return (    <nav className="navbar">
      <div className="navbar-container">
        {/* Inventory Hamburger Menu - Only show on inventory page */}
        {isInventoryPage && (
          <InventoryHamburgerMenu onSectionChange={handleInventorySectionChange} />
        )}
        
        {/* POS Hamburger Menu - Only show on POS page */}
        {isPOSPage && (
          <POSHamburgerMenu onSectionChange={handlePOSSectionChange} />
        )}
        
        {/* Logo/Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <h2>Rhuden Construction</h2>
        </Link>{/* Desktop Navigation Links */}
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
          </Link>        </div>

        {/* User Indicator */}
        <div className="user-indicator">
          <span className="user-name">
            {userProfile?.name || currentUser?.email?.split('@')[0] || 'User'}
          </span>
          <span className="user-role">
            ({userProfile?.role || 'staff'})
          </span>
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
          Transactions        </Link>
        
        {/* Mobile User Indicator */}
        <div className="mobile-user-indicator">
          <span className="mobile-user-name">
            {userProfile?.name || currentUser?.email?.split('@')[0] || 'User'}
          </span>
          <span className="mobile-user-role">
            ({userProfile?.role || 'staff'})
          </span>
        </div>
        
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