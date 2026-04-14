const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  status: {
    type: String,
    enum: ['PENDING', 'AWAITING_VERIFICATION', 'PAID'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  utr: {
    type: String,
    default: '',
  },
  proofImageUrl: {
    type: String,
    default: '',
  },
  proofSubmittedAt: {
    type: Date,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

paymentSchema.pre('save', function syncIsPaidAndStatus() {
  if (!this.status) {
    this.status = this.isPaid ? 'PAID' : 'PENDING';
  }

  if (this.status === 'PAID' && !this.isPaid) {
    this.isPaid = true;
  }

  if (this.status !== 'PAID' && this.isPaid) {
    this.isPaid = false;
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;