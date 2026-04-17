import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useUX } from '../context/UXContext';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [apartmentError, setApartmentError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    apartmentNumber: '',
  });

  const { name, email, password, phone, apartmentNumber } = formData;
  const { notify, track } = useUX();

  const apartmentPattern = /^[A-Za-z]-?\d{2,4}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setMessage('Session expired. Please login again.');
      setMessageType('error');
      track('auth_session_expired_prompt');
    }
  }, [track]);

  const getPasswordStrength = (value) => {
    if (!value) return 'Enter a strong password';
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Medium';
    return 'Strong';
  };

  const EyeIcon = ({ isVisible }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {isVisible && (
        <line
          x1="4"
          y1="20"
          x2="20"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );

  const resetForgotFlow = () => {
    setIsForgotPassword(false);
    setForgotStep(1);
    setForgotOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setMessage('');
    setMessageType('');
  };

  const validateForm = () => {
    const errors = {};
    if (!emailPattern.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password.trim()) {
      errors.password = 'Password is required.';
    } else if (isRegister && password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (isRegister) {
      if (!name.trim()) {
        errors.name = 'Name is required.';
      }
      if (!registerConfirmPassword.trim()) {
        errors.registerConfirmPassword = 'Please re-enter password.';
      } else if (password !== registerConfirmPassword) {
        errors.registerConfirmPassword = 'Passwords do not match.';
      }
      if (!apartmentPattern.test(apartmentNumber.trim())) {
        errors.apartmentNumber = 'Use apartment format like A-101.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onChange = (e) => {
    if (message) {
      setMessage('');
      setMessageType('');
    }
    if (e.target.name === 'apartmentNumber' && apartmentError) {
      setApartmentError('');
    }
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
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
    setRegisterConfirmPassword('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      track('auth_submit_blocked_validation', { mode: isRegister ? 'register' : 'login' });
      return;
    }

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
      notify(isRegister ? 'Account created successfully.' : 'Welcome back.');
      track('auth_submit_success', { mode: isRegister ? 'register' : 'login' });

      const decodedToken = jwtDecode(res.data.token);
      const isAdmin = Boolean(decodedToken?.user?.isAdmin);
      window.location.href = isAdmin ? '/admin' : '/maintenance';

    } catch (err) {
      const errorCode = err.response?.data?.code;
      const errorMsg = err.response?.data?.msg || 'Something went wrong. Please try again.';
      console.error(err.response?.data || err.message);
      if (isRegister && errorCode === 'APARTMENT_EXISTS') {
        setApartmentError(errorMsg);
      }
      setMessage(errorMsg);
      setMessageType('error');
      track('auth_submit_error', { mode: isRegister ? 'register' : 'login', code: errorCode || 'unknown' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      setFieldErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await axios.post('/api/auth/forgot-password', { email: trimmedEmail }, {
        headers: { 'Content-Type': 'application/json' },
      });
      setMessage('If an account exists, OTP has been sent.');
      setMessageType('success');
      setForgotStep(2);
      track('auth_forgot_otp_requested');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Unable to send OTP. Please try again.');
      setMessageType('error');
      track('auth_forgot_otp_request_error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    const otpPattern = /^\d{6}$/;
    if (!otpPattern.test(forgotOtp.trim())) {
      setFieldErrors({ otp: 'Please enter a valid 6-digit OTP.' });
      return;
    }
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      const res = await axios.post('/api/auth/verify-reset-otp', {
        email: email.trim(),
        otp: forgotOtp.trim(),
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      setResetToken(res.data.resetToken);
      setMessage('OTP verified. Set your new password.');
      setMessageType('success');
      setForgotStep(3);
      track('auth_forgot_otp_verified');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Invalid OTP.');
      setMessageType('error');
      track('auth_forgot_otp_verify_error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!resetToken) {
      errors.general = 'Reset session expired. Please verify OTP again.';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await axios.post('/api/auth/reset-password', {
        resetToken,
        newPassword,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      notify('Password reset successful. Please login.');
      setMessage('Password reset successful. Please login with your new password.');
      setMessageType('success');
      resetForgotFlow();
      setFormData((prev) => ({ ...prev, password: '' }));
      track('auth_forgot_password_reset_success');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to reset password.');
      setMessageType('error');
      track('auth_forgot_password_reset_error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h1>{isForgotPassword ? 'Reset Password' : isRegister ? 'Create Your Account' : 'Welcome Back'}</h1>
      <p className="auth-subtitle">
        {isForgotPassword
          ? 'Verify your identity with OTP sent to your registered email.'
          : isRegister
            ? 'Register to access billing, announcements, and community updates.'
            : 'Sign in to manage your maintenance and society updates.'}
      </p>
      {message && <div className={`auth-message ${messageType}`}>{message}</div>}
      {!isForgotPassword && (
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
            {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
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
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="inline-text-button password-icon-button password-icon-inside"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon isVisible={showPassword} />
            </button>
          </div>
          {isRegister && <small className="form-hint">Strength: {getPasswordStrength(password)}</small>}
          {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
        </div>
        {isRegister && (
          <>
            <div className="form-group">
              <label htmlFor="registerConfirmPassword">Re-enter Password</label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="registerConfirmPassword"
                  value={registerConfirmPassword}
                  onChange={(e) => {
                    setRegisterConfirmPassword(e.target.value);
                    if (fieldErrors.registerConfirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, registerConfirmPassword: '' }));
                    }
                  }}
                  placeholder="Re-enter your password"
                  required
                />
                <button
                  type="button"
                  className="inline-text-button password-icon-button password-icon-inside"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon isVisible={showPassword} />
                </button>
              </div>
              {fieldErrors.registerConfirmPassword && <small className="field-error">{fieldErrors.registerConfirmPassword}</small>}
            </div>
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
              <small className="form-hint">Format example: A-101</small>
              {fieldErrors.apartmentNumber && <small className="field-error">{fieldErrors.apartmentNumber}</small>}
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
      )}

      {isForgotPassword && forgotStep === 1 && (
        <form onSubmit={handleForgotRequestOtp}>
          <div className="form-group">
            <label htmlFor="forgotEmail">Registered Email</label>
            <input
              type="email"
              id="forgotEmail"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="you@example.com"
              required
            />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {isForgotPassword && forgotStep === 2 && (
        <form onSubmit={handleForgotVerifyOtp}>
          <div className="form-group">
            <label htmlFor="forgotOtp">Enter OTP</label>
            <input
              type="text"
              id="forgotOtp"
              value={forgotOtp}
              onChange={(e) => {
                setForgotOtp(e.target.value);
                if (fieldErrors.otp) {
                  setFieldErrors((prev) => ({ ...prev, otp: '' }));
                }
              }}
              placeholder="6-digit OTP"
              maxLength={6}
              required
            />
            {fieldErrors.otp && <small className="field-error">{fieldErrors.otp}</small>}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      {isForgotPassword && forgotStep === 3 && (
        <form onSubmit={handleForgotResetPassword}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrap">
              <input
                type={showResetPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                className="inline-text-button password-icon-button password-icon-inside"
                onClick={() => setShowResetPassword((prev) => !prev)}
                aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                title={showResetPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon isVisible={showResetPassword} />
              </button>
            </div>
            {fieldErrors.newPassword && <small className="field-error">{fieldErrors.newPassword}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrap">
              <input
                type={showResetPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
              <button
                type="button"
                className="inline-text-button password-icon-button password-icon-inside"
                onClick={() => setShowResetPassword((prev) => !prev)}
                aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                title={showResetPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon isVisible={showResetPassword} />
              </button>
            </div>
            {fieldErrors.confirmPassword && <small className="field-error">{fieldErrors.confirmPassword}</small>}
          </div>
          {fieldErrors.general && <small className="field-error">{fieldErrors.general}</small>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Set New Password'}
          </button>
        </form>
      )}

      {!isRegister && !isForgotPassword && (
        <button
          type="button"
          className="auth-switch-button"
          onClick={() => {
            setIsForgotPassword(true);
            setForgotStep(1);
            setMessage('');
            setMessageType('');
            setFieldErrors({});
            track('auth_forgot_mode_entered');
          }}
        >
          Forgot Password?
        </button>
      )}

      {isForgotPassword && (
        <button
          type="button"
          className="auth-switch-button"
          onClick={resetForgotFlow}
        >
          Back to Login
        </button>
      )}
      <button
        className="auth-switch-button"
        onClick={() => {
          setIsRegister(!isRegister);
          setIsForgotPassword(false);
          resetForm();
          setMessage('');
          setMessageType('');
          setFieldErrors({});
          track('auth_mode_toggled', { mode: !isRegister ? 'register' : 'login' });
        }}
      >
        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default LoginPage;