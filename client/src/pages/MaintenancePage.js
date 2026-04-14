import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY); // You'll need to add this to your .env

function MaintenancePage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        const res = await axios.get('/api/payments/my', config);
        setPayments(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handlePayClick = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    alert('Payment successful!');
    setShowPaymentForm(false);
    setSelectedPayment(null);
    // Re-fetch payments to update status
    // You might want to implement a more robust state management or real-time update
    const fetchPayments = async () => {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'x-auth-token': token,
            },
          };
          const res = await axios.get('/api/payments/my', config);
          setPayments(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchPayments();
  };

  if (loading) {
    return (
      <div className="page-loader">
        <span className="page-loader-spinner" />
        <p>Loading payments...</p>
      </div>
    );
  }
  if (error) return <div>Error: {error}</div>;

  const paidCount = payments.filter((payment) => payment.isPaid).length;
  const unpaidCount = payments.length - paidCount;

  return (
    <div className="maintenance-container">
      <h1>My Maintenance Payments</h1>
      <div className="payment-summary">
        <div className="summary-card">
          <span>Total Bills</span>
          <strong>{payments.length}</strong>
        </div>
        <div className="summary-card">
          <span>Paid</span>
          <strong>{paidCount}</strong>
        </div>
        <div className="summary-card">
          <span>Pending</span>
          <strong>{unpaidCount}</strong>
        </div>
      </div>
      {payments.length === 0 ? (
        <p>No maintenance payments found.</p>
      ) : (
        <ul className="payment-list">
          {payments.map((payment) => (
            <li key={payment._id} className={payment.isPaid ? 'paid' : 'unpaid'}>
              <p>Amount: ₹{payment.amount}</p>
              <p>Due Date: {new Date(payment.dueDate).toLocaleDateString()}</p>
              <p>
                Status:{' '}
                <span className={`status-badge ${payment.isPaid ? 'status-paid' : 'status-unpaid'}`}>
                  {payment.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </p>
              {!payment.isPaid && (
                <button onClick={() => handlePayClick(payment)}>Pay Now</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showPaymentForm && selectedPayment && (
        <div className="payment-form-modal">
          <h2>Pay for Maintenance</h2>
          <p>Payment for: ${selectedPayment.amount}</p>
          <Elements stripe={stripePromise}>
            <PaymentForm payment={selectedPayment} onSuccess={handlePaymentSuccess} />
          </Elements>
          <button onClick={() => setShowPaymentForm(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default MaintenancePage;