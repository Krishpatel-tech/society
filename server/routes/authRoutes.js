const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware'); // Import auth middleware
const sendEmail = require('../utils/sendEmail');

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildResetOtpEmail = ({ otp }) => `
  <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px; color:#111827;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      <div style="background:#1e3a8a; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">Password Reset OTP</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin-top:0;">Dear Resident,</p>
        <p>We received a request to reset your account password.</p>
        <p style="margin-bottom:6px;">Use the OTP below to continue:</p>
        <div style="display:inline-block; font-size:24px; letter-spacing:4px; font-weight:700; color:#1e3a8a; padding:10px 14px; border:1px dashed #93c5fd; border-radius:6px; background:#eff6ff;">
          ${otp}
        </div>
        <p style="margin-top:14px;">This OTP expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p style="margin-bottom:0;">Regards,<br/><strong>KAMAXI TRIPLEX Society Management</strong></p>
      </div>
    </div>
  </div>
`;

// @route   GET api/auth
// @desc    Get authenticated user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone, apartmentNumber, isAdmin } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const existingApartment = await User.findOne({ apartmentNumber });
    if (existingApartment) {
      return res.status(400).json({ code: 'APARTMENT_EXISTS', msg: 'Apartment number is already registered' });
    }

    user = new User({
      name,
      email,
      password,
      phone,
      apartmentNumber,
      isAdmin: isAdmin || false,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ msg: 'Token error or missing secret' });
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000 && err.keyPattern?.apartmentNumber) {
      return res.status(400).json({ code: 'APARTMENT_EXISTS', msg: 'Apartment number is already registered' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ msg: 'Token error or missing secret' });
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Request password reset OTP
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ msg: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);

      user.passwordResetOtpHash = otpHash;
      user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      user.passwordResetOtpAttempts = 0;
      user.passwordResetRequestedAt = new Date();
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - KAMAXI TRIPLEX',
        message: buildResetOtpEmail({ otp }),
      });
    }

    return res.json({ msg: 'If an account exists, OTP has been sent.' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/verify-reset-otp
// @desc    Verify password reset OTP and return reset token
// @access  Public
router.post('/verify-reset-otp', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();

  if (!email || !otp) {
    return res.status(400).json({ msg: 'Email and OTP are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ msg: 'Invalid or expired OTP.' });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }

    if ((user.passwordResetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ msg: 'Too many invalid attempts. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, user.passwordResetOtpHash);
    if (!isMatch) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ msg: 'Invalid or expired OTP.' });
    }

    const resetPayload = {
      purpose: 'password_reset',
      user: { id: user.id },
    };
    const resetSecret = process.env.PASSWORD_RESET_JWT_SECRET || process.env.JWT_SECRET;
    const resetToken = jwt.sign(resetPayload, resetSecret, { expiresIn: '10m' });

    return res.json({ resetToken });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/reset-password
// @desc    Set new password with reset token
// @access  Public
router.post('/reset-password', async (req, res) => {
  const resetToken = String(req.body.resetToken || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!resetToken || !newPassword) {
    return res.status(400).json({ msg: 'Reset token and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters.' });
  }

  try {
    const resetSecret = process.env.PASSWORD_RESET_JWT_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(resetToken, resetSecret);
    if (decoded.purpose !== 'password_reset' || !decoded.user?.id) {
      return res.status(401).json({ msg: 'Invalid or expired reset token.' });
    }

    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetRequestedAt = null;
    await user.save();

    return res.json({ msg: 'Password reset successful. Please login with your new password.' });
  } catch (err) {
    console.error(err.message);
    return res.status(401).json({ msg: 'Invalid or expired reset token.' });
  }
});

module.exports = router;