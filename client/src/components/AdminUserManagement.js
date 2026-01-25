import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    apartmentNumber: '',
    isAdmin: false,
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
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.checked });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };
      await axios.post('/api/auth/register', newUserData, config);
      alert('User added successfully!');
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
      console.error(err.response?.data?.msg || err.message);
      alert('Error adding user: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        await axios.delete(`/api/users/${userId}`, config);
        alert('User deleted successfully!');
        fetchUsers(); // Refresh the user list
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        alert('Error deleting user: ' + (err.response?.data?.msg || err.message));
      }
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
          <button type="submit">Add Member</button>
        </form>
      )}

      <ul className="user-list">
        {users.map((user) => (
          <li key={user._id}>
            <span>{user.name} ({user.email}) - Apt: {user.apartmentNumber} {user.isAdmin && ' (Admin)'}</span>
            <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminUserManagement;