import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userRole: 'staff'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user
      
      console.log('User signed in successfully:', user.email)
      
      // Redirect to dashboard on successful authentication
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">        <div className="login-header">
          <h1>Rhuden Construction</h1>
          <p>Enterprise Management System</p>
        </div>        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="userRole">User Role</label>
            <select
              id="userRole"
              name="userRole"
              value={formData.userRole}
              onChange={handleInputChange}
              className="form-select"
              required
              disabled={loading}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/register')}
                className="link-button"
              >
                Register here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login