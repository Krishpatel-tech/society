const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');

// @route   POST api/stripe/create-payment-intent
// @desc    Create a Stripe Payment Intent
// @access  Private
router.post('/create-payment-intent', auth, async (req, res) => {
  const { amount, paymentId } = req.body; // paymentId is the ID of our internal Payment record

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents
      currency: 'inr',
      metadata: { integration_check: 'accept_a_payment', paymentId: paymentId },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;