import React, { useState } from 'react';
import axios from 'axios';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [apartmentError, setApartmentError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    apartmentNumber: '',
  });

  const { name, email, password, phone, apartmentNumber } = formData;

  const onChange = (e) => {
    if (message) {
      setMessage('');
      setMessageType('');
    }
    if (e.target.name === 'apartmentNumber' && apartmentError) {
      setApartmentError('');
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      apartmentNumber: '',
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');
    setApartmentError('');
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      let url = '';
      let data = {};

      if (isRegister) {
        url = '/api/auth/register';
        data = { name, email, password, phone, apartmentNumber };
      } else {
        url = '/api/auth/login';
        data = { email, password };
      }

      const res = await axios.post(url, data, config);

      localStorage.setItem('token', res.data.token);
      setMessage(isRegister ? 'Registration successful! Redirecting...' : 'Login successful! Redirecting...');
      setMessageType('success');
      // Redirect to maintenance page or dashboard
      window.location.href = '/'; // Force full page reload to update App.js state

    } catch (err) {
      const errorCode = err.response?.data?.code;
      const errorMsg = err.response?.data?.msg || 'Something went wrong. Please try again.';
      console.error(err.response?.data || err.message);
      if (isRegister && errorCode === 'APARTMENT_EXISTS') {
        setApartmentError(errorMsg);
      }
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h1>{isRegister ? 'Create Your Account' : 'Welcome Back'}</h1>
      <p className="auth-subtitle">
        {isRegister ? 'Register to access billing, announcements, and community updates.' : 'Sign in to manage your maintenance and society updates.'}
      </p>
      {message && <div className={`auth-message ${messageType}`}>{message}</div>}
      <form onSubmit={onSubmit}>
        {isRegister && (
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Enter your full name"
              required={isRegister}
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Enter your password"
            required
          />
        </div>
        {isRegister && (
          <>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={phone}
                onChange={onChange}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="form-group">
              <label htmlFor="apartmentNumber">Apartment Number</label>
              <input
                type="text"
                id="apartmentNumber"
                name="apartmentNumber"
                value={apartmentNumber}
                onChange={onChange}
                placeholder="A-101"
                required
              />
              {apartmentError && <small className="field-error">{apartmentError}</small>}
            </div>
          </>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="button-loading-content">
              <span className="button-loader" />
              {isRegister ? 'Creating Account...' : 'Signing In...'}
            </span>
          ) : (
            isRegister ? 'Register' : 'Login'
          )}
        </button>
      </form>
      <button
        className="auth-switch-button"
        onClick={() => {
          setIsRegister(!isRegister);
          resetForm();
          setMessage('');
          setMessageType('');
        }}
      >
        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default LoginPage;