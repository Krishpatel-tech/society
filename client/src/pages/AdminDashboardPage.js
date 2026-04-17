import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminUserManagement from '../components/AdminUserManagement';
import { useUX } from '../context/UXContext';

function AdminDashboardPage() {
  // const [users, setUsers] = useState([]); // User state moved to AdminUserManagement
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'payments', 'announcements'

  const [showAddAnnouncementForm, setShowAddAnnouncementForm] = useState(false);
  const [newAnnouncementData, setNewAnnouncementData] = useState({
    title: '',
    content: '',
    sendEmail: false,
    sendSMS: false,
  });

  // State for adding payments
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    amount: '',
    dueDate: '',
    selectedMembers: [],
  });
  const [allUsers, setAllUsers] = useState([]); // To fetch all users for payment assignment

  // State for editing payments
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editPaymentData, setEditPaymentData] = useState({
    amount: '',
    dueDate: '',
  });
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const { notify, track } = useUX();

  const fetchUsers = useCallback(async () => {
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
      const res = await axios.get('/api/users', config);
      setAllUsers(res.data);
      track('admin_users_fetch_success', { count: res.data.length });
    } catch (err) {
      console.error('Error fetching users for payment form:', err);
      track('admin_users_fetch_error', { message: err.message });
    }
  }, [track]);

  const fetchData = useCallback(async () => {
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

      // Fetch all payments (Admin only route)
      const paymentsRes = await axios.get('/api/payments', config);
      setPayments(paymentsRes.data);

      // Fetch all announcements
      const announcementsRes = await axios.get('/api/announcements', config);
      setAnnouncements(announcementsRes.data);

      setLoading(false);
      setError(null);
      track('admin_dashboard_fetch_success', { payments: paymentsRes.data.length, announcements: announcementsRes.data.length });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      track('admin_dashboard_fetch_error', { message: err.message });
    }
  }, [track]);

  useEffect(() => {
    fetchData();
    if (activeTab === 'payments' || activeTab === 'users') { // Fetch users when on payments or users tab
      fetchUsers(); 
    }
  }, [activeTab, fetchData, fetchUsers]); // Refetch when tab changes for potentially updated data

  const handlePaymentInputChange = (e) => {
    setNewPaymentData({ ...newPaymentData, [e.target.name]: e.target.value });
  };

  const handleMemberSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.options)
      .filter(option => option.selected)
      .map(option => option.value);
    setNewPaymentData({ ...newPaymentData, selectedMembers: selectedOptions });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };

      const { amount, dueDate, selectedMembers } = newPaymentData;
      const data = { amount: parseFloat(amount), dueDate, memberIds: selectedMembers };

      await axios.post('/api/payments/batch', data, config);
      notify('Payments created successfully.', 'success');
      track('admin_payment_batch_created', { selectedCount: selectedMembers.length || 'all' });
      setShowAddPaymentForm(false);
      setNewPaymentData({
        amount: '',
        dueDate: '',
        selectedMembers: [],
      });
      fetchData(); // Refresh all data including payments
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error creating payments: ${err.response?.data?.msg || err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReminder = async (paymentId, userName) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };
      await axios.post(`/api/payments/remind/${paymentId}`, {}, config);
      notify(`Reminder sent to ${userName}.`, 'success');
      track('admin_payment_reminder_sent', { paymentId });
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error sending reminder: ${err.response?.data?.msg || err.message}`, 'error');
    }
  };

  const handleEditPaymentClick = (payment) => {
    setEditingPaymentId(payment._id);
    setEditPaymentData({ amount: payment.amount, dueDate: payment.dueDate.substring(0, 10) }); // Format date for input
  };

  const handleEditPaymentChange = (e) => {
    setEditPaymentData({ ...editPaymentData, [e.target.name]: e.target.value });
  };

  const handleUpdatePayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };
      const { amount, dueDate } = editPaymentData;
      await axios.put(`/api/payments/${paymentId}`, { amount: parseFloat(amount), dueDate }, config);
      notify('Payment updated successfully.', 'success');
      track('admin_payment_updated', { paymentId });
      setEditingPaymentId(null);
      fetchData(); // Refresh payments list
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error updating payment: ${err.response?.data?.msg || err.message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditPaymentData({ amount: '', dueDate: '', });
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };
      await axios.delete(`/api/payments/${paymentId}`, config);
      notify('Payment deleted successfully.', 'success');
      setPayments(payments.filter(payment => payment._id !== paymentId));
      track('admin_payment_deleted', { paymentId });
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error deleting payment: ${err.response?.data?.msg || err.message}`, 'error');
    }
  };

  const handleVerifyPayment = async (paymentId, action) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };
      await axios.put(`/api/payments/${paymentId}/verify`, { action }, config);
      notify(action === 'approve' ? 'Payment marked as paid and user notified.' : 'Proof rejected and payment set back to pending.', action === 'approve' ? 'success' : 'info');
      track('admin_payment_verification', { action, paymentId });
      fetchData();
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error verifying payment: ${err.response?.data?.msg || err.message}`, 'error');
    }
  };

  const handleAnnouncementInputChange = (e) => {
    setNewAnnouncementData({ ...newAnnouncementData, [e.target.name]: e.target.value });
  };

  const handleAnnouncementCheckboxChange = (e) => {
    setNewAnnouncementData({ ...newAnnouncementData, [e.target.name]: e.target.checked });
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };
      await axios.post('/api/announcements', newAnnouncementData, config);
      notify('Announcement added successfully.', 'success');
      track('admin_announcement_added');
      setShowAddAnnouncementForm(false);
      setNewAnnouncementData({
        title: '',
        content: '',
        sendEmail: false,
        sendSMS: false,
      });
      fetchData(); // Refresh all data including announcements
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error adding announcement: ${err.response?.data?.msg || err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };
      await axios.delete(`/api/announcements/${announcementId}`, config);
      notify('Announcement deleted successfully.', 'success');
      setAnnouncements(announcements.filter(announcement => announcement._id !== announcementId));
      track('admin_announcement_deleted', { announcementId });
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error deleting announcement: ${err.response?.data?.msg || err.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <span className="page-loader-spinner" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }
  if (error) return <div>Error: {error}</div>;

  const visiblePayments = payments.filter((payment) => {
    if (paymentFilter === 'all') return true;
    if (paymentFilter === 'awaiting') return payment.status === 'AWAITING_VERIFICATION';
    if (paymentFilter === 'unpaid') return payment.status !== 'PAID';
    return true;
  });

  return (
    <div className="admin-dashboard-container">
      <h1>Admin Dashboard</h1>
      <div className="tabs">
        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}>Manage Members</button>
        <button onClick={() => setActiveTab('payments')} className={activeTab === 'payments' ? 'active' : ''}>Manage Payments</button>
        <button onClick={() => setActiveTab('announcements')} className={activeTab === 'announcements' ? 'active' : ''}>Manage Announcements</button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <AdminUserManagement />
        )}

        {activeTab === 'payments' && (
          <div>
            <h2>Manage Payments</h2>
            <div className="section-meta-row">
              <label htmlFor="paymentFilter">Filter payments</label>
              <select id="paymentFilter" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="awaiting">Awaiting verification</option>
                <option value="unpaid">Unpaid only</option>
              </select>
            </div>
            <button onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}>
              {showAddPaymentForm ? 'Cancel Create Payment' : 'Create New Payment'}
            </button>

            {showAddPaymentForm && (
              <div className="dialog-overlay" onClick={() => setShowAddPaymentForm(false)}>
                <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
                  <form onSubmit={handleAddPayment} className="payment-creation-form">
                    <h3>Create New Payment</h3>
                    <div className="form-group">
                      <label htmlFor="amount">Amount (₹)</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={newPaymentData.amount}
                        onChange={handlePaymentInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dueDate">Due Date</label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={newPaymentData.dueDate}
                        onChange={handlePaymentInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="members">Select Members (Optional - leave blank for all)</label>
                      <select
                        id="members"
                        name="selectedMembers"
                        multiple
                        value={newPaymentData.selectedMembers}
                        onChange={handleMemberSelectChange}
                        className="multi-select"
                      >
                        {allUsers.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.apartmentNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="dialog-actions">
                      <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Payments'}</button>
                      <button type="button" className="secondary-button" onClick={() => setShowAddPaymentForm(false)}>
                        Close
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {visiblePayments.length === 0 ? (
              <p>No payments found.</p>
            ) : (
              <ul className="payment-list">
                {visiblePayments.map((payment) => (
                  <li key={payment._id} className={payment.isPaid ? 'paid' : 'unpaid'}>
                    {editingPaymentId === payment._id ? (
                      <div className="edit-payment-form">
                        <div className="form-group">
                          <label htmlFor="editAmount">Amount (₹)</label>
                          <input
                            type="number"
                            id="editAmount"
                            name="amount"
                            value={editPaymentData.amount}
                            onChange={handleEditPaymentChange}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="editDueDate">Due Date</label>
                          <input
                            type="date"
                            id="editDueDate"
                            name="dueDate"
                            value={editPaymentData.dueDate}
                            onChange={handleEditPaymentChange}
                          />
                        </div>
                        <button onClick={() => handleUpdatePayment(payment._id)}>Save</button>
                        <button onClick={handleCancelEdit} className="secondary-button">Cancel</button>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const userName = payment.user?.name || 'Unknown Member';
                          const apartmentNumber = payment.user?.apartmentNumber || 'N/A';
                          return (
                            <>
                        <div className="payment-detail-grid">
                          <p><strong>User</strong><span>{userName}</span></p>
                          <p><strong>Apartment</strong><span>{apartmentNumber}</span></p>
                          <p><strong>Amount</strong><span>₹{payment.amount}</span></p>
                          <p><strong>Due Date</strong><span>{new Date(payment.dueDate).toLocaleDateString()}</span></p>
                          <p><strong>Status</strong><span>{payment.status || (payment.isPaid ? 'PAID' : 'PENDING')}</span></p>
                          {payment.utr && (
                            <p><strong>UTR</strong><span>{payment.utr}</span></p>
                          )}
                        </div>
                        {payment.proofImageUrl && (
                          <a href={payment.proofImageUrl} target="_blank" rel="noreferrer" className="proof-link">
                            View Payment Screenshot
                          </a>
                        )}
                        <div className="payment-actions">
                          <button onClick={() => handleEditPaymentClick(payment)}>Edit</button>
                          <button onClick={() => handleDeletePayment(payment._id)} className="secondary-button">Delete</button>
                          {payment.status !== 'PAID' && (
                            <button onClick={() => handleSendReminder(payment._id, userName)} className="secondary-button">Send Reminder</button>
                          )}
                          {payment.status === 'AWAITING_VERIFICATION' && (
                            <>
                              <button onClick={() => handleVerifyPayment(payment._id, 'approve')}>Approve Paid</button>
                              <button onClick={() => handleVerifyPayment(payment._id, 'reject')} className="secondary-button">Reject Proof</button>
                            </>
                          )}
                        </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            <h2>Announcements</h2>
            <button onClick={() => setShowAddAnnouncementForm(!showAddAnnouncementForm)}>
              {showAddAnnouncementForm ? 'Cancel Add Announcement' : 'Add New Announcement'}
            </button>

            {showAddAnnouncementForm && (
              <div className="dialog-overlay" onClick={() => setShowAddAnnouncementForm(false)}>
                <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
                  <form onSubmit={handleAddAnnouncement} className="announcement-form">
                    <h3>Add New Announcement</h3>
                    <div className="form-group">
                      <label htmlFor="newAnnouncementTitle">Title</label>
                      <input
                        type="text"
                        id="newAnnouncementTitle"
                        name="title"
                        value={newAnnouncementData.title}
                        onChange={handleAnnouncementInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newAnnouncementContent">Content</label>
                      <textarea
                        id="newAnnouncementContent"
                        name="content"
                        value={newAnnouncementData.content}
                        onChange={handleAnnouncementInputChange}
                        required
                      ></textarea>
                    </div>
                    <div className="form-group checkbox-group">
                      <input
                        type="checkbox"
                        id="sendEmail"
                        name="sendEmail"
                        checked={newAnnouncementData.sendEmail}
                        onChange={handleAnnouncementCheckboxChange}
                      />
                      <label htmlFor="sendEmail">Send Email Notification</label>
                    </div>
                    <div className="form-group checkbox-group">
                      <input
                        type="checkbox"
                        id="sendSMS"
                        name="sendSMS"
                        checked={newAnnouncementData.sendSMS}
                        onChange={handleAnnouncementCheckboxChange}
                      />
                      <label htmlFor="sendSMS">Send SMS Notification</label>
                    </div>
                    <div className="dialog-actions">
                      <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Announcement'}</button>
                      <button type="button" className="secondary-button" onClick={() => setShowAddAnnouncementForm(false)}>
                        Close
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {announcements.length === 0 ? (
              <p>No announcements found.</p>
            ) : (
              <ul className="announcement-list">
                {announcements.map((announcement) => (
                  <li key={announcement._id} className="announcement-item">
                    <span>{announcement.title} - By {announcement.author?.name || 'Unknown'} on {new Date(announcement.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => handleDeleteAnnouncement(announcement._id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;