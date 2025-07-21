import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import './styles/App.css'
import './styles/discount.css'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import POS from './pages/POS'
import Register from './pages/Register'
import TransactionHistory from './pages/TransactionHistory'
import CreditPayments from './pages/CreditPayments'
import FinancialReports from './pages/FinancialReports'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

function AppContent() {
  const location = useLocation()
  const hideNavBar = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="app">
      {!hideNavBar && <NavBar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/pos" element={
          <ProtectedRoute>
            <POS />
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <TransactionHistory />
          </ProtectedRoute>
        } />
        <Route path="/credit-payments" element={
          <ProtectedRoute>
            <CreditPayments />
          </ProtectedRoute>
        } />
        <Route path="/financial-reports" element={
          <ProtectedRoute>
            <FinancialReports />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
