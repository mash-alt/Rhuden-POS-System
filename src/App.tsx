import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import './styles/App.css'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import POS from './pages/POS'
import Register from './pages/Register'
import TransactionHistory from './pages/TransactionHistory'
import NavBar from './components/NavBar'

function AppContent() {
  const location = useLocation()
  const hideNavBar = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="app">
      {!hideNavBar && <NavBar />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
