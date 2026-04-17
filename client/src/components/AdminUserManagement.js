import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUX } from '../context/UXContext';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [apartmentError, setApartmentError] = useState('');
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    apartmentNumber: '',
    isAdmin: false,
  });
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
      setUsers(res.data);
      setLoading(false);
      setError(null);
      track('admin_member_list_loaded', { count: res.data.length });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      track('admin_member_list_error', { message: err.message });
    }
  }, [track]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    if (e.target.name === 'apartmentNumber' && apartmentError) {
      setApartmentError('');
    }
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.checked });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setApartmentError('');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };
      await axios.post('/api/auth/register', newUserData, config);
      notify('Member added successfully.', 'success');
      track('admin_member_added');
      setShowAddUserForm(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        phone: '',
        apartmentNumber: '',
        isAdmin: false,
      });
      fetchUsers(); // Refresh the user list
    } catch (err) {
      const errorCode = err.response?.data?.code;
      const errorMsg = err.response?.data?.msg || err.message;
      console.error(errorMsg);
      if (errorCode === 'APARTMENT_EXISTS') {
        setApartmentError(errorMsg);
      } else {
        notify(`Error adding user: ${errorMsg}`, 'error');
      }
      track('admin_member_add_error', { code: errorCode || 'unknown' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };
      await axios.delete(`/api/users/${userId}`, config);
      notify('User deleted successfully.', 'success');
      track('admin_member_deleted', { userId });
      fetchUsers();
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      notify(`Error deleting user: ${err.response?.data?.msg || err.message}`, 'error');
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users: {error}</div>;

  return (
    <div>
      <h2>Manage Members</h2>
      <button onClick={() => setShowAddUserForm(!showAddUserForm)}>
        {showAddUserForm ? 'Cancel Add Member' : 'Add New Member'}
      </button>

      {showAddUserForm && (
        <div className="dialog-overlay" onClick={() => setShowAddUserForm(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddUser} className="user-form">
              <h3>Add New Member</h3>
              <div className="form-group">
                <label htmlFor="newName">Name</label>
                <input
                  type="text"
                  id="newName"
                  name="name"
                  value={newUserData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newEmail">Email</label>
                <input
                  type="email"
                  id="newEmail"
                  name="email"
                  value={newUserData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="password"
                  value={newUserData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPhone">Phone</label>
                <input
                  type="text"
                  id="newPhone"
                  name="phone"
                  value={newUserData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newApartmentNumber">Apartment Number</label>
                <input
                  type="text"
                  id="newApartmentNumber"
                  name="apartmentNumber"
                  value={newUserData.apartmentNumber}
                  onChange={handleInputChange}
                  required
                />
                {apartmentError && <small className="field-error">{apartmentError}</small>}
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="newIsAdmin"
                  name="isAdmin"
                  checked={newUserData.isAdmin}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor="newIsAdmin">Is Admin</label>
              </div>
              <div className="dialog-actions">
                <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Member'}</button>
                <button type="button" className="secondary-button" onClick={() => setShowAddUserForm(false)}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ul className="user-list">
        {users.map((user) => (
          <li key={user._id}>
            <span className="member-primary-text">{user.name} ({user.email}) - Apt: {user.apartmentNumber} {user.isAdmin && ' (Admin)'}</span>
            <button className="member-delete-button" onClick={() => handleDeleteUser(user._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminUserManagement;