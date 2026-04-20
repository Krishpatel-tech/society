const Payment = require('../models/Payment');
const User = require('../models/User'); // Import User model
const auth = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail'); // Import sendEmail utility
const generateInvoicePdf = require('../utils/generateInvoicePdf'); // Import PDF generation utility

const express = require('express');
const router = express.Router();

const UPI_QR_IMAGE_URL = process.env.UPI_QR_IMAGE_URL || '';
const UPI_ID = process.env.UPI_ID || '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'society@kamaxitriplex.me';
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '+91 90991 95719';

const buildMaintenanceIssuedEmail = ({ user, amount, dueDate }) => `
  <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px; color:#111827;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      <div style="background:#1e3a8a; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">Maintenance Payment Notice</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin-top:0;">Dear <strong>${user.name}</strong>,</p>
        <p>A new maintenance invoice has been generated for your apartment.</p>
        <table style="width:100%; border-collapse:collapse; margin:14px 0;">
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Apartment</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${user.apartmentNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Amount Due</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">INR ${Number(amount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Due Date</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${new Date(dueDate).toLocaleDateString()}</td>
          </tr>
        </table>
        <p>Please find the invoice attached and complete payment through the society portal before the due date.</p>
        <p style="margin-bottom:0;">Regards,<br/><strong>KAMAXI TRIPLEX Society Management</strong></p>
      </div>
      <div style="background:#f3f4f6; padding:12px 20px; font-size:12px; color:#4b5563;">
        Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}
      </div>
    </div>
  </div>
`;

const buildPaymentApprovedEmail = ({ user, payment }) => `
  <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px; color:#111827;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      <div style="background:#065f46; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">Payment Verification Confirmation</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin-top:0;">Dear <strong>${user.name}</strong>,</p>
        <p>Your maintenance payment has been successfully verified.</p>
        <table style="width:100%; border-collapse:collapse; margin:14px 0;">
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Apartment</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${user.apartmentNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Amount Paid</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">INR ${Number(payment.amount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>UTR / Reference</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${payment.utr || 'N/A'}</td>
          </tr>
        </table>
        <p>Thank you for your timely payment.</p>
        <p style="margin-bottom:0;">Regards,<br/><strong>KAMAXI TRIPLEX Society Management</strong></p>
      </div>
      <div style="background:#f3f4f6; padding:12px 20px; font-size:12px; color:#4b5563;">
        Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}
      </div>
    </div>
  </div>
`;

const buildPaymentReminderEmail = ({ user, payment }) => `
  <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px; color:#111827;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      <div style="background:#7c2d12; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">Payment Reminder</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin-top:0;">Dear <strong>${user.name}</strong>,</p>
        <p>This is a reminder for your pending society maintenance payment.</p>
        <table style="width:100%; border-collapse:collapse; margin:14px 0;">
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Apartment</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${user.apartmentNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Amount Due</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">INR ${Number(payment.amount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;"><strong>Due Date</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${new Date(payment.dueDate).toLocaleDateString()}</td>
          </tr>
        </table>
        <p>Please complete payment at the earliest through the society portal.</p>
        <p style="margin-bottom:0;">Regards,<br/><strong>KAMAXI TRIPLEX Society Management</strong></p>
      </div>
      <div style="background:#f3f4f6; padding:12px 20px; font-size:12px; color:#4b5563;">
        Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}
      </div>
    </div>
  </div>
`;

const serializePayment = (paymentDoc) => {
  const payment = paymentDoc.toObject ? paymentDoc.toObject() : paymentDoc;
  const resolvedStatus = payment.status || (payment.isPaid ? 'PAID' : 'PENDING');
  return {
    ...payment,
    status: resolvedStatus,
    isPaid: resolvedStatus === 'PAID',
  };
};

// @route   GET api/payments/qr-config
// @desc    Get global UPI QR configuration
// @access  Private
router.get('/qr-config', auth, async (req, res) => {
  res.json({
    upiQrImageUrl: UPI_QR_IMAGE_URL,
    upiId: UPI_ID,
  });
});

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
      status: 'PENDING',
    }));

    const createdPayments = await Payment.insertMany(newPayments);

    // Send email notifications with PDF invoices to affected users
    for (const user of usersToBill) {
      const paymentDetail = createdPayments.find(p => p.user.toString() === user._id.toString());
      if (paymentDetail) {
        // Generate PDF invoice
        generateInvoicePdf(paymentDetail, user, async (pdfBuffer) => {
          const emailContent = buildMaintenanceIssuedEmail({ user, amount, dueDate });

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
    const payments = await Payment.find({})
      .populate('user', 'name email apartmentNumber')
      .populate('verifiedBy', 'name email');
    res.json(payments.map(serializePayment));
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
    res.json(payments.map(serializePayment));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/payments/:id/submit-proof
// @desc    Submit UPI payment proof for verification (User)
// @access  Private
router.put('/:id/submit-proof', auth, async (req, res) => {
  const { utr, proofImageUrl } = req.body;

  if (!utr || !proofImageUrl) {
    return res.status(400).json({ msg: 'Please provide both UTR and payment screenshot.' });
  }

  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to submit proof for this payment' });
    }

    const resolvedStatus = payment.status || (payment.isPaid ? 'PAID' : 'PENDING');
    if (resolvedStatus === 'PAID') {
      return res.status(400).json({ msg: 'This payment is already marked as paid.' });
    }

    payment.utr = String(utr).trim();
    payment.proofImageUrl = proofImageUrl;
    payment.proofSubmittedAt = new Date();
    payment.status = 'AWAITING_VERIFICATION';
    payment.isPaid = false;

    const updatedPayment = await payment.save();
    res.json(serializePayment(updatedPayment));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/payments/:id/verify
// @desc    Verify submitted proof and approve/reject payment (Admin)
// @access  Private/Admin
router.put('/:id/verify', auth, auth.admin, async (req, res) => {
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ msg: 'Invalid action. Use approve or reject.' });
  }

  try {
    const payment = await Payment.findById(req.params.id).populate('user', 'name email apartmentNumber');

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    const resolvedStatus = payment.status || (payment.isPaid ? 'PAID' : 'PENDING');
    if (action === 'approve') {
      if (resolvedStatus === 'PAID') {
        return res.status(400).json({ msg: 'Payment is already marked as paid.' });
      }

      payment.status = 'PAID';
      payment.isPaid = true;
      payment.paymentMethod = payment.paymentMethod || 'UPI';
      payment.transactionId = payment.transactionId || payment.utr || '';
      payment.verifiedAt = new Date();
      payment.verifiedBy = req.user.id;

      await sendEmail({
        email: payment.user.email,
        subject: 'Maintenance Payment Received Successfully',
        message: buildPaymentApprovedEmail({ user: payment.user, payment }),
      });
    } else {
      payment.status = 'PENDING';
      payment.isPaid = false;
      payment.verifiedAt = undefined;
      payment.verifiedBy = undefined;
    }

    const updatedPayment = await payment.save();
    res.json(serializePayment(updatedPayment));
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
    if (isPaid !== undefined) {
      payment.status = isPaid ? 'PAID' : 'PENDING';
    }
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    payment.transactionId = transactionId || payment.transactionId;

    const updatedPayment = await payment.save();
    res.json(serializePayment(updatedPayment));
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
    const reminderEmailContent = buildPaymentReminderEmail({ user, payment });

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