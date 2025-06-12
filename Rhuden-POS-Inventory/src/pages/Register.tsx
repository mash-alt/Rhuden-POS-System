import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'
import type { CreateUser } from '../types'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const authUser = userCredential.user

      // Create user document in Firestore
      const userData: CreateUser = {
        uid: authUser.uid,
        name: formData.name,
        role: 'staff', // Default role
        email: formData.email
      }

      // Save user to Firestore using the auth UID as document ID
      await setDoc(doc(db, 'users', authUser.uid), userData)

      console.log('User registered successfully:', userData)
      // Redirect to login after successful registration
      navigate('/login')
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Join Rhuden Construction</h1>
          <p>Create your account</p>
        </div>        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
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
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your full name"
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
              placeholder="Create a password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="login-footer">
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register