import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    apartmentNumber: '',
    isAdmin: false,
  });

  const navigate = useNavigate();

  const { name, email, password, phone, apartmentNumber, isAdmin } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
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
        data = { name, email, password, phone, apartmentNumber, isAdmin };
      } else {
        url = '/api/auth/login';
        data = { email, password };
      }

      const res = await axios.post(url, data, config);

      localStorage.setItem('token', res.data.token);
      // Redirect to maintenance page or dashboard
      window.location.href = '/'; // Force full page reload to update App.js state

    } catch (err) {
      console.error(err.response.data);
      alert('Error: ' + err.response.data.msg);
    }
  };

  return (
    <div className="login-container">
      <h1>{isRegister ? 'Register' : 'Login'}</h1>
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
                required
              />
            </div>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={isAdmin}
                onChange={onCheckboxChange}
              />
              <label htmlFor="isAdmin">Register as Admin</label>
            </div>
          </>
        )}
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default LoginPage;