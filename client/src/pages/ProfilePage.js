import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
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

        // The /api/auth endpoint returns the logged-in user's details
        const res = await axios.get('/api/auth', config);
        setUserProfile(res.data);
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        setError('Failed to fetch user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <div className="profile-container">Loading profile...</div>;
  if (error) return <div className="profile-container error-message">Error: {error}</div>;
  if (!userProfile) return <div className="profile-container">No profile data found.</div>;

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      <div className="profile-details">
        <p><strong>Name:</strong> {userProfile.name}</p>
        <p><strong>Email:</strong> {userProfile.email}</p>
        <p><strong>Apartment Number:</strong> {userProfile.apartmentNumber}</p>
        {userProfile.phone && <p><strong>Phone:</strong> {userProfile.phone}</p>}
        <p><strong>Member Since:</strong> {new Date(userProfile.date).toLocaleDateString()}</p>
        {userProfile.isAdmin && <p className="admin-status"><strong>Role:</strong> Administrator</p>}
      </div>
    </div>
  );
}

export default ProfilePage;