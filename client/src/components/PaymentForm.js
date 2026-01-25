import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';

const CARD_OPTIONS = {
  iconStyle: 'solid',
  style: {
    base: {
      iconColor: '#c4f0ff',
      color: '#fff',
      fontWeight: 500,
      fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '-webkit-autofill': { color: '#fce883' },
      '::placeholder': { color: '#87bbfd' },
    },
    invalid: {
      iconColor: '#ffc7ee',
      color: '#ffc7ee',
    },
  },
};

function PaymentForm({ payment, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };

      // Create Payment Intent on your backend
      const { data: clientSecretData } = await axios.post(
        '/api/stripe/create-payment-intent',
        { amount: payment.amount, paymentId: payment._id },
        config
      );

      const clientSecret = clientSecretData.clientSecret;

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (confirmError) {
        setError(confirmError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Update your backend payment record
        await axios.put(
          `/api/payments/${payment._id}`,
          { isPaid: true, paymentMethod: 'Stripe', transactionId: paymentIntent.id },
          config
        );
        onSuccess();
      } else {
        setError('Payment not successful. Status: ' + paymentIntent.status);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || err.message || 'An unknown error occurred.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group">
        <label>Card Details</label>
        <CardElement options={CARD_OPTIONS} />
      </div>
      {error && <div className="error-message">{error}</div>}
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${payment.amount}`}
      </button>
    </form>
  );
}

export default PaymentForm;