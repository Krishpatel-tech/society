import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUX } from '../context/UXContext';

function HomePage() {
  const societyPhotos = ['/society/1.png', '/society/2.png'];
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [paymentOverview, setPaymentOverview] = useState(null);
  const { track } = useUX();

  useEffect(() => {
    if (societyPhotos.length <= 1) return undefined;
    const intervalId = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % societyPhotos.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [societyPhotos.length]);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const res = await axios.get('/api/announcements');
        const topThree = [...res.data]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentAnnouncements(topThree);
        track('home_highlights_loaded', { count: topThree.length });
      } catch (error) {
        track('home_highlights_error', { message: error.message });
      }
    };

    fetchHighlights();
  }, [track]);

  useEffect(() => {
    const fetchPaymentOverview = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get('/api/payments/my', {
          headers: {
            'x-auth-token': token,
          },
        });
        const pending = res.data.filter((item) => item.status !== 'PAID').length;
        setPaymentOverview({
          total: res.data.length,
          pending,
          paid: res.data.length - pending,
        });
      } catch (error) {
        track('home_payments_overview_error', { message: error.message });
      }
    };

    fetchPaymentOverview();
  }, [track]);

  return (
    <div className="home-container">
      <h1>Welcome to KAMAXI TRIPLEX Society App!</h1>
      <p>Your one-stop solution for society maintenance, announcements, and more.</p>
      {paymentOverview && (
        <div className="payment-summary">
          <div className="summary-card">
            <span>Total Bills</span>
            <strong>{paymentOverview.total}</strong>
          </div>
          <div className="summary-card">
            <span>Pending Bills</span>
            <strong>{paymentOverview.pending}</strong>
          </div>
          <div className="summary-card">
            <span>Paid Bills</span>
            <strong>{paymentOverview.paid}</strong>
          </div>
        </div>
      )}
      <div className="society-gallery-section">
        <h2>Our Society</h2>
        <div className="society-slider">
          {societyPhotos.map((photo, index) => (
            <img
              key={photo}
              src={photo}
              alt={`Society view ${index + 1}`}
              className={`society-slide ${index === activeIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        <div className="society-slider-dots">
          {societyPhotos.map((photo, index) => (
            <button
              key={`dot-${photo}`}
              type="button"
              className={`society-slider-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show society image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="home-highlights">
        <h2>Latest Community Updates</h2>
        {recentAnnouncements.length === 0 ? (
          <p className="form-hint">No recent updates right now.</p>
        ) : (
          <div className="home-announcement-grid">
            {recentAnnouncements.map((item) => (
              <article key={item._id} className="home-announcement-card">
                <h3>{item.title}</h3>
                <p>{item.content.length > 120 ? `${item.content.slice(0, 120)}...` : item.content}</p>
                <small>{new Date(item.createdAt).toLocaleDateString()}</small>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;