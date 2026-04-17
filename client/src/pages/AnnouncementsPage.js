import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUX } from '../context/UXContext';

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const { track } = useUX();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get('/api/announcements');
        setAnnouncements(res.data);
        setLoading(false);
        track('announcements_fetch_success', { count: res.data.length });
      } catch (err) {
        setError(err.message);
        setLoading(false);
        track('announcements_fetch_error', { message: err.message });
      }
    };
    fetchAnnouncements();
  }, [track]);

  const now = Date.now();
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = `${announcement.title} ${announcement.content}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (dateFilter === 'all') return true;
    const createdAt = new Date(announcement.createdAt).getTime();
    const ageHours = (now - createdAt) / (1000 * 60 * 60);
    if (dateFilter === 'recent') return ageHours <= 72;
    if (dateFilter === 'thisMonth') return ageHours <= 24 * 31;
    return true;
  });

  const isHighPriority = (announcement) => {
    const text = `${announcement.title} ${announcement.content}`.toLowerCase();
    return text.includes('urgent') || text.includes('important') || text.includes('notice');
  };

  if (loading) return <div className="page-loader"><span className="page-loader-spinner" /><p>Loading announcements...</p></div>;
  if (error) return <div className="announcements-container"><p className="error-message">Error: {error}</p></div>;

  return (
    <div className="announcements-container">
      <h1>Announcements</h1>
      <div className="announcement-toolbar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or content"
          aria-label="Search announcements"
        />
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} aria-label="Filter announcements by date">
          <option value="all">All dates</option>
          <option value="recent">Last 3 days</option>
          <option value="thisMonth">This month</option>
        </select>
      </div>
      {filteredAnnouncements.length === 0 ? (
        <div className="empty-state">
          <p>No announcements match your filters.</p>
          <p className="form-hint">Try clearing search or selecting a broader date range.</p>
        </div>
      ) : (
        <div className="announcement-list">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement._id} className="announcement-item">
              {isHighPriority(announcement) && <span className="priority-badge">High Priority</span>}
              <h2>{announcement.title}</h2>
              <p>{announcement.content}</p>
              <p className="announcement-meta">
                By {announcement.author?.name || 'Unknown user'} on{' '}
                {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown date'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;