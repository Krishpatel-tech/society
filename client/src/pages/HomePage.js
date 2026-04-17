import React, { useEffect, useState } from 'react';

function HomePage() {
  const societyPhotos = ['/society/1.png', '/society/2.png'];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (societyPhotos.length <= 1) return undefined;
    const intervalId = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % societyPhotos.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [societyPhotos.length]);

  return (
    <div className="home-container">
      <h1>Welcome to KAMAXI TRIPLEX Society App!</h1>
      <p>Your one-stop solution for society maintenance, announcements, and more.</p>
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
    </div>
  );
}

export default HomePage;