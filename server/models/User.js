const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  apartmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  passwordResetOtpHash: {
    type: String,
    default: null,
  },
  passwordResetOtpExpiresAt: {
    type: Date,
    default: null,
  },
  passwordResetOtpAttempts: {
    type: Number,
    default: 0,
  },
  passwordResetRequestedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;