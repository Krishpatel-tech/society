import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminUserManagement from '../components/AdminUserManagement'; // Import new component

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

  const fetchUsers = async () => {
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
    } catch (err) {
      console.error('Error fetching users for payment form:', err);
      // Optionally set an error state here
    }
  };

  const fetchData = async () => {
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
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'payments' || activeTab === 'users') { // Fetch users when on payments or users tab
      fetchUsers(); 
    }
  }, [activeTab]); // Refetch when tab changes for potentially updated data

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
      alert('Payments created successfully!');
      setShowAddPaymentForm(false);
      setNewPaymentData({
        amount: '',
        dueDate: '',
        selectedMembers: [],
      });
      fetchData(); // Refresh all data including payments
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert('Error creating payments: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleSendReminder = async (paymentId, userName) => {
    if (window.confirm(`Are you sure you want to send a payment reminder to ${userName}?`)) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        await axios.post(`/api/payments/remind/${paymentId}`, {}, config);
        alert('Payment reminder sent successfully!');
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        alert('Error sending reminder: ' + (err.response?.data?.msg || err.message));
      }
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
      alert('Payment updated successfully!');
      setEditingPaymentId(null);
      fetchData(); // Refresh payments list
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert('Error updating payment: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditPaymentData({ amount: '', dueDate: '', });
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        await axios.delete(`/api/payments/${paymentId}`, config);
        alert('Payment deleted successfully!');
        setPayments(payments.filter(payment => payment._id !== paymentId));
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        alert('Error deleting payment: ' + (err.response?.data?.msg || err.message));
      }
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
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };
      await axios.post('/api/announcements', newAnnouncementData, config);
      alert('Announcement added successfully!');
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
      alert('Error adding announcement: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        await axios.delete(`/api/announcements/${announcementId}`, config);
        alert('Announcement deleted successfully!');
        setAnnouncements(announcements.filter(announcement => announcement._id !== announcementId));
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        alert('Error deleting announcement: ' + (err.response?.data?.msg || err.message));
      }
    }
  };

  if (loading) return <div>Loading admin dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

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
            <button onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}>
              {showAddPaymentForm ? 'Cancel Create Payment' : 'Create New Payment'}
            </button>

            {showAddPaymentForm && (
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
                <button type="submit">Create Payments</button>
              </form>
            )}

            {payments.length === 0 ? (
              <p>No payments found.</p>
            ) : (
              <ul className="payment-list">
                {payments.map((payment) => (
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
                        <span>User: {payment.user.name} ({payment.user.apartmentNumber}), Amount: ₹{payment.amount}, Due: {new Date(payment.dueDate).toLocaleDateString()}, Paid: {payment.isPaid ? 'Yes' : 'No'}</span>
                        <div className="payment-actions">
                          <button onClick={() => handleEditPaymentClick(payment)}>Edit</button>
                          <button onClick={() => handleDeletePayment(payment._id)} className="secondary-button">Delete</button>
                          {!payment.isPaid && (
                            <button onClick={() => handleSendReminder(payment._id, payment.user.name)} className="secondary-button">Send Reminder</button>
                          )}
                        </div>
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
                <button type="submit">Add Announcement</button>
              </form>
            )}

            {announcements.length === 0 ? (
              <p>No announcements found.</p>
            ) : (
              <ul className="announcement-list">
                {announcements.map((announcement) => (
                  <li key={announcement._id} className="announcement-item">
                    <span>{announcement.title} - By {announcement.author.name} on {new Date(announcement.createdAt).toLocaleDateString()}</span>
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