import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MaintenancePage() {
  const MAX_PROOF_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [qrConfig, setQrConfig] = useState({ upiQrImageUrl: '', upiId: '' });
  const [proofData, setProofData] = useState({ utr: '', proofImageUrl: '' });
  const [proofError, setProofError] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

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

  const fetchQrConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };
      const res = await axios.get('/api/payments/qr-config', config);
      setQrConfig(res.data);
    } catch (err) {
      console.error('Error fetching UPI QR config:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchQrConfig();
  }, []);

  const handlePayClick = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(true);
    setProofData({ utr: '', proofImageUrl: '' });
    setProofError('');
  };

  const handleProofInputChange = (e) => {
    setProofData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (proofError) {
      setProofError('');
    }
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
      setProofError('Screenshot is too large. Please upload an image under 4 MB.');
      setProofData((prev) => ({ ...prev, proofImageUrl: '' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofData((prev) => ({ ...prev, proofImageUrl: reader.result }));
      setProofError('');
    };
    reader.onerror = () => {
      setProofError('Unable to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    if (!proofData.utr.trim() || !proofData.proofImageUrl) {
      setProofError('Please provide both UTR and screenshot.');
      return;
    }

    setSubmittingProof(true);
    setProofError('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };

      await axios.put(
        `/api/payments/${selectedPayment._id}/submit-proof`,
        {
          utr: proofData.utr.trim(),
          proofImageUrl: proofData.proofImageUrl,
        },
        config
      );

      alert('Payment proof submitted successfully. Awaiting admin verification.');
      setShowPaymentForm(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      if (err.response?.status === 413) {
        setProofError('Screenshot is too large for upload. Please use a smaller image.');
      } else {
        setProofError(err.response?.data?.msg || err.message || 'Failed to submit proof.');
      }
    } finally {
      setSubmittingProof(false);
    }
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
                <span className={`status-badge ${payment.status === 'PAID' ? 'status-paid' : 'status-unpaid'}`}>
                  {payment.status === 'AWAITING_VERIFICATION' ? 'Awaiting Verification' : payment.status === 'PAID' ? 'Paid' : 'Pending'}
                </span>
              </p>
              {payment.status !== 'PAID' && (
                <button onClick={() => handlePayClick(payment)} disabled={payment.status === 'AWAITING_VERIFICATION'}>
                  {payment.status === 'AWAITING_VERIFICATION' ? 'Proof Submitted' : 'Pay via UPI'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showPaymentForm && selectedPayment && (
        <div className="payment-form-modal">
          <h2>Pay via UPI</h2>
          <p>Maintenance Amount: ₹{selectedPayment.amount}</p>
          {qrConfig.upiId && <p>UPI ID: {qrConfig.upiId}</p>}
          {qrConfig.upiQrImageUrl ? (
            <img src={qrConfig.upiQrImageUrl} alt="UPI QR Code" className="upi-qr-image" />
          ) : (
            <p>UPI QR is not configured yet. Please contact admin.</p>
          )}
          <form onSubmit={handleSubmitProof} className="payment-proof-form">
            <div className="form-group">
              <label htmlFor="utr">UTR / Reference Number</label>
              <input
                type="text"
                id="utr"
                name="utr"
                value={proofData.utr}
                onChange={handleProofInputChange}
                placeholder="Enter transaction UTR"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="proofImage">Payment Screenshot</label>
              <input
                type="file"
                id="proofImage"
                accept="image/*"
                onChange={handleProofFileChange}
                required
              />
            </div>
            {proofData.proofImageUrl && (
              <div className="proof-preview">
                <img src={proofData.proofImageUrl} alt="Payment proof preview" />
              </div>
            )}
            {proofError && <div className="error-message">{proofError}</div>}
            <button type="submit" disabled={submittingProof}>
              {submittingProof ? 'Submitting...' : 'Submit Proof'}
            </button>
          </form>
          <button onClick={() => setShowPaymentForm(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default MaintenancePage;