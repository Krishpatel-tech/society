const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Placeholder for SMS sending function (e.g., using Twilio)
const sendSMS = async (phoneNumber, message) => {
  console.log(`Sending SMS to ${phoneNumber}: ${message}`);
  // Implement actual SMS sending logic here using a service like Twilio
};

// @route   POST api/notifications/maintenance-due
// @desc    Send maintenance due notifications (Admin only)
// @access  Private/Admin
router.post('/maintenance-due', auth, async (req, res) => {
  // In a real application, you'd check for admin role here.
  // For now, allowing any authenticated user to trigger (for testing).
  try {
    const upcomingPayments = await Payment.find({
      isPaid: false,
      dueDate: { $lte: new Date(new Date().setDate(new Date().getDate() + 7)) }, // Due in next 7 days
    }).populate('user', 'email phone name');

    for (const payment of upcomingPayments) {
      const user = payment.user;
      const subject = 'Maintenance Due Reminder';
      const message = `Dear ${user.name},
Your maintenance payment of $${payment.amount} is due on ${payment.dueDate.toDateString()}.
Please make the payment soon.

Thank you.`;

      if (user.email) {
        await sendEmail({
          email: user.email,
          subject,
          message,
        });
      }

      if (user.phone) {
        await sendSMS(user.phone, message);
      }
    }

    res.json({ msg: 'Maintenance due notifications sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;