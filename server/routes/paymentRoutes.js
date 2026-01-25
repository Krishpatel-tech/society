const Payment = require('../models/Payment');
const User = require('../models/User'); // Import User model
const auth = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail'); // Import sendEmail utility
const generateInvoicePdf = require('../utils/generateInvoicePdf'); // Import PDF generation utility

const express = require('express');
const router = express.Router();

// @route   POST api/payments/batch
// @desc    Create multiple payment records (for all or specific members) (Admin only)
// @access  Private/Admin
router.post('/batch', auth, auth.admin, async (req, res) => {
  const { amount, dueDate, memberIds } = req.body; // memberIds is an optional array of user IDs

  if (!amount || !dueDate) {
    return res.status(400).json({ msg: 'Please provide amount and due date.' });
  }

  try {
    let usersToBill = [];
    if (memberIds && memberIds.length > 0) {
      usersToBill = await User.find({ _id: { $in: memberIds } });
    } else {
      usersToBill = await User.find({}); // Bill all users if no specific IDs are provided
    }

    if (usersToBill.length === 0) {
      return res.status(404).json({ msg: 'No members found to create payments for.' });
    }

    const newPayments = usersToBill.map(user => ({
      user: user._id,
      amount,
      dueDate,
      isPaid: false,
    }));

    const createdPayments = await Payment.insertMany(newPayments);

    // Send email notifications with PDF invoices to affected users
    for (const user of usersToBill) {
      const paymentDetail = createdPayments.find(p => p.user.toString() === user._id.toString());
      if (paymentDetail) {
        // Generate PDF invoice
        generateInvoicePdf(paymentDetail, user, async (pdfBuffer) => {
          const emailContent = `Dear ${user.name},\n
        
          A new maintenance payment of ₹${amount} has been issued for your apartment (Apt: ${user.apartmentNumber}).\n
          It is due on ${new Date(dueDate).toLocaleDateString()}.\n
          Please find your invoice attached.\n
          
          Please log in to the society portal to view details and make your payment.\n 
          
          Regards,\n
          KAMAXI TRIPLEX Society Management`;

          const attachments = [
            {
              filename: `invoice_${paymentDetail._id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ];

          try {
            await sendEmail({
              email: user.email,
              subject: 'New Maintenance Payment Issued - Invoice Attached',
              message: emailContent,
              attachments,
            });
            console.log(`Notification email with PDF sent to ${user.email} for new payment.`);
          } catch (emailErr) {
            console.error(`Error sending email to ${user.email}:`, emailErr);
          }
        });
      }
    }

    res.status(201).json({ msg: `${createdPayments.length} payments created successfully.`, payments: createdPayments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/payments
// @desc    Add a new payment record (Admin only) - Can be used for single payments
// @access  Private/Admin
router.post('/', auth, auth.admin, async (req, res) => {
  const { user, amount, dueDate, isPaid, paymentMethod, transactionId } = req.body;

  try {
    const payment = new Payment({
      user,
      amount,
      dueDate,
      isPaid,
      paymentMethod,
      transactionId,
    });

    const createdPayment = await payment.save();
    res.status(201).json(createdPayment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payments
// @desc    Get all payments (Admin only)
// @access  Private/Admin
router.get('/', auth, auth.admin, async (req, res) => {
  try {
    const payments = await Payment.find({}).populate('user', 'name email apartmentNumber');
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payments/my
// @desc    Get all payments for the authenticated user
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id });
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/payments/:id
// @desc    Update a payment (Admin only can update amount/dueDate, users can update status via Stripe callback)
// @access  Private/Admin
router.put('/:id', auth, auth.admin, async (req, res) => {
  const { amount, dueDate, isPaid, paymentMethod, transactionId } = req.body;

  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    // Only allow admins to change amount and dueDate
    if (req.user.isAdmin) {
      payment.amount = amount !== undefined ? amount : payment.amount;
      payment.dueDate = dueDate !== undefined ? dueDate : payment.dueDate;
    } else if (payment.user.toString() !== req.user.id) {
        // If not admin, ensure user owns payment for other updates
        return res.status(401).json({ msg: 'Not authorized to update this payment' });
    }

    // Allow both user (via payment gateway callback) and admin to update these fields
    payment.isPaid = isPaid !== undefined ? isPaid : payment.isPaid;
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    payment.transactionId = transactionId || payment.transactionId;

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/payments/:id
// @desc    Delete a payment (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, auth.admin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    await Payment.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Payment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/payments/remind/:id
// @desc    Send a payment reminder email for a specific payment (Admin only)
// @access  Private/Admin
router.post('/remind/:id', auth, auth.admin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('user', 'name email apartmentNumber');

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    if (payment.isPaid) {
      return res.status(400).json({ msg: 'Payment is already marked as paid.' });
    }

    const user = payment.user;
    const reminderEmailContent = `Dear ${user.name},
    
    This is a friendly reminder that your maintenance payment of ₹${payment.amount} for apartment (Apt: ${user.apartmentNumber}) is due on ${new Date(payment.dueDate).toLocaleDateString()}.
    
    Please log in to the society portal to view details and make your payment.
    
    Regards,
    KAMAXI TRIPLEX Society Management`;

    await sendEmail({
      email: user.email,
      subject: 'Payment Reminder: Maintenance Fee Due',
      message: reminderEmailContent,
    });

    console.log(`Payment reminder email sent to ${user.email} for payment ID ${payment._id}.`);
    res.json({ msg: 'Payment reminder sent successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;