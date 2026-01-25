import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get('/api/announcements');
        setAnnouncements(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) return <div>Loading announcements...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="announcements-container">
      <h1>Announcements</h1>
      {announcements.length === 0 ? (
        <p>No announcements found.</p>
      ) : (
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <div key={announcement._id} className="announcement-item">
              <h2>{announcement.title}</h2>
              <p>{announcement.content}</p>
              <p className="announcement-meta">
                By {announcement.author.name} on {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;